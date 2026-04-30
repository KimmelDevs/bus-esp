from machine import Pin, PWM, I2C, SPI
import network
import time
import ujson
from umqtt.simple import MQTTClient
from lcd_api import LcdApi
from pico_i2c_lcd import I2cLcd
from mfrc522 import MFRC522

# ==========================
# WIFI CONFIG
# ==========================
ssid = "GFiber_39E55"
password = "28673359"

wifi = network.WLAN(network.STA_IF)
wifi.active(True)
wifi.connect(ssid, password)

timeout = 15
start = time.time()
while not wifi.isconnected():
    if time.time() - start > timeout:
        print("WiFi failed")
        break
    time.sleep(1)

if wifi.isconnected():
    print("WiFi OK:", wifi.ifconfig()[0])

# ==========================
# LCD
# ==========================
i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=400000)
lcd = I2cLcd(i2c, 0x27, 2, 16)
lcd.clear()
lcd.putstr("Smart BUS Ready")
time.sleep(2)

# ==========================
# HARDWARE
# ==========================
servo = PWM(Pin(13), freq=50)
led = Pin(2, Pin.OUT)
buzzer = PWM(Pin(12))
buzzer.duty(0)

# ==========================
# RFID
# ==========================
spi = SPI(2, baudrate=500000, polarity=0, phase=0,
          sck=Pin(18), mosi=Pin(23), miso=Pin(19))
rdr = MFRC522(spi=spi, gpioRst=4, gpioCs=5)

# ==========================
# FUNCTIONS
# ==========================
def servo_write(angle):
    duty = int((angle / 180 * 75) + 40)
    servo.duty(duty)

def beep(t=0.5):
    buzzer.freq(2000)
    buzzer.duty(512)
    time.sleep(t)
    buzzer.duty(0)

def close_door():
    servo_write(0)
    led.value(0)
    lcd.clear()
    lcd.putstr("Tap Card")

def open_door():
    lcd.clear()
    lcd.putstr("ACCESS GRANTED")
    servo_write(90)
    led.value(1)
    beep(0.5)
    time.sleep(2)
    close_door()

# ==========================
# MQTT TOPICS
# ==========================
# Publish:  esp/rfid/scan    -> raw UID when card is tapped
# Publish:  esp/rfid/result  -> server result string  (APPROVED|balance etc)
# Subscribe: rfid/+/balance  -> top-up confirmations from web app

# ==========================
# MQTT CALLBACK
# ==========================
def mqtt_callback(topic, msg):
    print("MQTT IN:", topic, msg)
    try:
        data = ujson.loads(msg.decode())
        uid = data.get("uid", "")
        amount = data.get("amount", 0)
        lcd.clear()
        lcd.putstr("TOP-UP OK")
        lcd.move_to(0, 1)
        lcd.putstr("+" + str(amount))
        beep(0.3)
    except Exception as e:
        print("MQTT callback error:", e)

# ==========================
# MQTT SETUP
# ==========================
mqtt_server = "broker.hivemq.com"
client_id = "ESP32_BUS_" + str(time.ticks_ms())
client = MQTTClient(client_id, mqtt_server, port=1883)

try:
    print("Connecting to MQTT...")
    client.set_callback(mqtt_callback)
    client.connect()
    print("MQTT Connected")
    client.subscribe(b"rfid/+/balance")
    client.publish(b"esp/rfid/status", b"ONLINE")
except Exception as e:
    print("MQTT ERROR:", e)

# ==========================
# PROCESS RFID RESULT
# (now comes via MQTT from web app, but we still handle
#  the reply on rfid/<uid>/result if you want server-side logic)
# ==========================
def handle_result(result_str, uid):
    """
    Web app publishes to  rfid/<uid>/result  with:
      APPROVED|<balance>
      INSUFFICIENT|<balance>
      INVALID
    """
    parts = result_str.split("|")
    status = parts[0].strip()
    balance = parts[1].strip() if len(parts) > 1 else "0"

    if status == "APPROVED":
        lcd.clear()
        lcd.putstr("APPROVED")
        lcd.move_to(0, 1)
        lcd.putstr("Bal:" + balance)
        open_door()

    elif status == "INSUFFICIENT":
        lcd.clear()
        lcd.putstr("NO BALANCE")
        beep(1)

    else:
        lcd.clear()
        lcd.putstr("INVALID CARD")
        beep(0.3)

# ==========================
# EXTENDED CALLBACK
# (handles both top-up and ride-result topics)
# ==========================
def mqtt_callback_full(topic, msg):
    topic_str = topic.decode() if isinstance(topic, bytes) else topic
    msg_str   = msg.decode()   if isinstance(msg, bytes)   else msg

    print("MQTT:", topic_str, "->", msg_str)

    # Top-up confirmation: rfid/<uid>/balance
    if "/balance" in topic_str:
        try:
            data = ujson.loads(msg_str)
            amount = data.get("amount", 0)
            lcd.clear()
            lcd.putstr("TOP-UP OK")
            lcd.move_to(0, 1)
            lcd.putstr("+" + str(amount))
            beep(0.3)
        except Exception as e:
            print("balance parse error:", e)

    # Ride result: rfid/<uid>/result  (APPROVED|balance etc.)
    elif "/result" in topic_str:
        uid_part = topic_str.split("/")[1] if len(topic_str.split("/")) > 1 else ""
        handle_result(msg_str, uid_part)

client.set_callback(mqtt_callback_full)
# Re-subscribe so the extended callback handles both topics
try:
    client.subscribe(b"rfid/+/balance")
    client.subscribe(b"rfid/+/result")
except Exception as e:
    print("Subscribe error:", e)

# ==========================
# MAIN LOOP
# ==========================
close_door()
lcd.clear()
lcd.putstr("System Ready")

last_uid = None
last_scan_time = 0
DEBOUNCE_MS = 3000  # don't re-scan same card within 3 s

while True:
    # Poll MQTT (top-up / result messages from web app)
    try:
        client.check_msg()
    except Exception as e:
        print("MQTT check error:", e)

    # RFID scan
    (stat, tag_type) = rdr.request(rdr.REQIDL)

    if stat == rdr.OK:
        (stat, uid) = rdr.anticoll()

        if stat == rdr.OK:
            uid_str = ":".join("%02X" % x for x in uid)
            now = time.ticks_ms()

            # Debounce: skip if same card scanned too recently
            if uid_str == last_uid and time.ticks_diff(now, last_scan_time) < DEBOUNCE_MS:
                time.sleep(0.2)
                continue

            last_uid = uid_str
            last_scan_time = now

            print("Scanned UID:", uid_str)
            lcd.clear()
            lcd.putstr("Scanning...")

            # Publish UID — web app picks this up and handles the logic
            try:
                client.publish(b"esp/rfid/scan", uid_str.encode())
            except Exception as e:
                print("Publish error:", e)
                lcd.clear()
                lcd.putstr("MQTT Error")

            # Subscribe to the result for this specific card
            result_topic = ("rfid/" + uid_str.replace(":", "") + "/result").encode()
            try:
                client.subscribe(result_topic)
            except Exception as e:
                print("Subscribe result error:", e)

            time.sleep(0.5)

    time.sleep(0.2)
