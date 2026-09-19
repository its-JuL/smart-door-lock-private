require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const log = '/home/sdl/registration_live_capture.log';
fs.writeFileSync(log, `capture started ${new Date().toISOString()}\n`);
const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: `registration_capture_${Date.now()}`
});
const topics = [
 'doorlock/main_esp32_01/command',
 'doorlock/main_esp32_01/registration',
 'doorlock/main_esp32_01/registration/result',
 'doorlock/main_esp32_01/command/result',
 'doorlock/main_esp32_01/auth'
];
client.on('connect', () => { client.subscribe(topics, {qos:1}, err => fs.appendFileSync(log, err ? `subscribe error ${err.message}\n` : 'subscribed\n')); });
client.on('message', (topic, message) => fs.appendFileSync(log, `${new Date().toISOString()} ${topic} ${message.toString()}\n`));
setTimeout(() => { fs.appendFileSync(log, `capture ended ${new Date().toISOString()}\n`); client.end(); }, 1800000);

