# Diseño e Implementación de Circuitos contadores.
## Informe de laboratorio

Nathalia Ávila
Pascal Arévalo
Mayo 2019

Universidad de La Sabana
Ingeniería informática
Lógica Digital
 
 
## Introducción
Para la integración de cada uno de los circuitos o módulos realizados y explicados a detalle anteriormente con Arduino realizamos un multiplexor utilizando el integrado 74LS151, con este, conectamos distintos inputs de los 5 módulos y los pasamos a pines de arduino.  El cual se conecta con un servidor web para visualizar la lógica digital de nuestro proyecto. Esto resulta vital porque en la vida real las soluciones de monitoreo remoto, con integración al mundo del Internet de las cosas están siendo ampliamente utilizadas . 

## Objetivos

Lograr diseñar una lógica de multiplexado de señales 
Conectar el arduino con la lógica digital del proyecto 
Leer los inputs registrados en un servidor web que actualice los cambios en tiempo real. 

## Marco Teórico - Punto parcial 

El arduino es una plataforma de desarrollo basada en una placa electrónica de hardware libre que incorpora un microcontrolador re-programable y una serie de pines hembra, los que permiten establecer conexiones entre el microcontrolador y los diferentes sensores y actuadores de una manera muy sencilla. Para fines prácticos utilizamos un Arduino Uno. 

Para la integración de cada uno de los circuitos o módulos realizados y explicados a detalle anteriormente con Arduino realizamos un multiplexor utilizando el integrado 74LS151, con este, conectamos distintos inputs de los 5 módulos y los pasamos a pines de arduino.  
 	

###### Funcionamiento del circuito

Las pestañas S0, S1, S2 son las entradas de selección, las cuales son enviadas desde el programa del arduino que se verá más adelante, las señales I0, I1, … , I7 representan todas las señales de las puertas, el sistema de alumbrado y el sistema de temperatura. Cada vez que el arduino realiza un ciclo de reloj se detecta la señal correspondiente de la tabla de verdad del integrado 74LS151. 

## Diseño de la solución.
###### Código Arduino
Este código nos permite pasar las señales multiplexadas por el 75LS151 a una lógica de arduino capaz de leer cada una de estas, para posteriormente ser enviadas a un servidor web y así configurar una solución IoT completa. Comenzamos importando una librería asíncrona que nos brinda la posibilidad de manejar tiempos de señales diferentes. 
###### Código

```
/*
* Configuración de la librería asincrónica del
* arduino, esto para permitirnos diferentes
* tiempos de señal
*/
#include "AsyncTaskLib.h"
/*
* Declaración de las variables iniciales, ledPins[]
* se refiere al contador de 3 bits binario ascendente
* count es la cuenta necesaria para el método
* dispBinary(byte n), el array_size detecta la cantidad
* de bits para el contador
*/
int ledPins[] = {10,11,12};
byte count = 0;
int array_size = sizeof(ledPins) / sizeof(ledPins[0]);


/*
* Tarea asincrónica, cambia el estado del pin 13 de
* HIGH a LOW y viceversa en el intervalo de 1 segundo.
*/
AsyncTask asyncTask(1000, true, []() {
   digitalWrite(13,HIGH);
   delay(1000);
   digitalWrite(13,LOW);
});


/*
* Setup de los pines iniciales y el puerto de impresión,
* el cual es necesario para la comunicación con PySerial
* en el archivo Arduino.py
*/
void setup() {
   pinMode(12, OUTPUT);
   pinMode(13,OUTPUT);
   pinMode(11, OUTPUT);
   pinMode(10, OUTPUT);
   pinMode(9, INPUT);
   Serial.begin(9600);

   asyncTask.Start();

}


/*
* Loop principal, aquí se actualiza tanto la tarea asincrónica
* como el contador de 3 bits, cada vez que se cambia la selección
* de datos, se imprime los bits obtenidos en el Serial 9600,
* la señal de reloj (pines 10,11,12) se introduce en un integrado
* 74LS151 que es un multiplexor de 8 a 1 líneas y el pin 9 registra
* los datos obtenidos por este multiplexor
*/
void loop() {
   asyncTask.Update();
   dispBinary(count++);
   if (count == 16){
       count = 0; 
   }
   Serial.println(String(digitalRead(ledPins[2])) + "-" + String(digitalRead(ledPins[1])) + "-" + String(digitalRead(ledPins[0]))+ "-" + String(digitalRead(9)));
}


/*
* Esta función convierte un número en base 10 a su equivalente
* en binario, por ejemplo:
* @args ( byte = 3 )
* @return 011
*/
void dispBinary(byte n){
   for (byte i = 0; i < array_size; i++){
       digitalWrite(ledPins[i], n & 1);
       n = n/2;
   }
}
```

###### Código en Python (Conector con arduino por puerto serie utilizando librería Pyserial)
Este código lo conectamos el con arduino mediante el puerto 9600 y al servidor montado en flask por el puerto 5000. Acá se comienza a leer las señales recibidas por el arduino y se revisan cada uno de los cambios que registra el sistema, cada vez que hay un cambio se envía un un request a los Web Sockets del servidor (los cuales explicaremos más adelante. )

###### Código
```
# Aquí se importan las librerías necesarias para el
# funcionamiento del programa, serial se utiliza para
# la conexión con el dispositivo arduino y socketio
# para la conexión con el servidor
import serial
import socketio

# En esta sección se realiza la conexión con los
# Sockets del servidor remoto
sio = socketio.Client()
sio.connect('http://localhost:5000')

# En esta sección se realiza la conexión con el
# dispositivo arduino
arduino = serial.Serial('/dev/cu.usbmodem14101',9600)
counter = 0
output,output_backup = [],[]


# Aquí se comienza un bucle para recibir constantemente
# las señales producidas por el arduino
while True:
   # rawString son las señales detectadas del arduino,
   # vienen de la forma 'X-X-X-X-X-X-...X' donde X
   # simboliza los bits producidos por la casa inteligente
   rawString = str(arduino.readline(),'utf-8').replace("\n","")
   if rawString is not None:
       output.append(int(rawString.split("-")[3].replace("\r","")))
       counter += 1

   if counter == 8:
       if output_backup != output:
           # si rawString ha cambiado de su posición anterior,
           # se entra a esta parte de código, se imprime en
           # consola el código encontrado y se hace un HTTP
           # request a los sockets del servidor remoto.
           print ('-'.join(str(e) for e in output))
           sio.emit('message', '-'.join(str(e) for e in output))
           output_backup = output
       output = []
       counter = 0
arduino.close()
```
 
###### Código del servidor web
Acá utilizamos un framework web escrito en python llamado Flask, esto nos permite montar un servidor para poder ver los cambios en tiempo real mediante el uso de una librería de web sockets, y mejorar la manera en la que el usuario accede al sistema de monitoreo de la casa. El puerto utilizado fue el 5000 (puerto por defecto). A continuación encontraremos el código comentado. 


###### Código
```
from flask import Flask,render_template, url_for, flash, redirect, request, jsonify
from flask_socketio import SocketIO, send, emit

# Configuracion basica del servidor en Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = '9f3f918414c3b8f36c904aa6085d019c'
app.debug = True
app.host = '0.0.0.0'
socketio = SocketIO(app)


# Ruta por defecto en http://127.0.0.1:5000/
@app.route("/")
def hello():
   return render_template('index.html')

# SocketIO: aquí se manejan los mensajes entrantes
# y salientes del servidor, este es el socket que
# recibe las señales del archivo arduino.py
@socketio.on('message')
def handle_message(message):
   print('received message: ' + message)
   send(message, broadcast=True)

if __name__ == '__main__':
   socketio.run(app)
```
###### Interfaz final web 
Como lenguaje de programación utilizamos HTML , acá definimos cada una de las etiquetas (puertas , ventanas , contador, temperatura, etc) y es desde donde el usuario podrá monitorear el sistema completo. Para la parte del cambio de estado utilizamos funciones de javascript, que traducen lo que enviamos a cambios visuales en el sistema. (Apagado-Encendido) Para la parte de diseño utilizamos tags básicos de CSS en donde definimos estilos , colores y la organización de la página web. Ahora bien, si se desea revisar este código, se dejará el Link del repositorio en github. 

## Resultados
Al finalizar el proyecto final de la materia pudimos realmente ver las aplicaciones prácticas y funcionales de todos los temas que vimos durante el transcurso de la clase. Adicionalmente fuimos capaces de arquitectar una solución de un campo que cada día se expande más (Internet de las cosas) y con este, llevamos a nuestro proyecto a un ámbito de producción casi-real con herramientas fundamentales en la vida del ingeniero moderno (Arduino, infraestructura y servidores web).
Una vez completado comenzamos a reflexionar y nos dimos cuenta de que realmente (Aunque fuimos un grupo de solamente dos personas) paso a paso se pueden obtener los conocimientos necesarios para realizar un trabajo del que nos sintamos orgullosos, que nos motive a aprender nuevas tecnologías y que nos acerque a las soluciones que hoy en día se están desarrollando en el mundo de la domótica y automatización.   

## Conclusiones 
- Aunque nos falta mucho por aprender estamos en la capacidad de diseñar soluciones con los temas vistos en clase. 
- El autoaprendizaje es una herramienta fundamental. 
- El trabajo en equipo debe ser gestionado de la mejor manera posible para evitar problemas y siempre actuar de manera ética frente a la asignatura. 
 
## Referencias 
 
[1] Thomas L. Floyd “Fundamentos de Sistemas Digitales” 11ª ed., Ed Pearson Education S.A., 2006

[2] Informes de laboratorio pasados. 
 
[3] Datasheets de los componentes. 
 
[4] https://www.afternerd.com/blog/python-http-server/
 
[5] https://www.arduino.cc/en/Main/Docs






