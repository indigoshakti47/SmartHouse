# Aqui se importan las librerias necesarias para el
# funcionamiento del programa, serial se utiliza para
# la conexion con el dispositivo arduino y socketio
# para la conexion con el servidor, 
import serial
import socketio

# En esta sección se realiza la conexion con los 
# Sockets del servidor remoto
sio = socketio.Client()
sio.connect('http://localhost:5000')

# En esta sección se realiza la conexion con el 
# dispositivo arduino
arduino = serial.Serial('/dev/cu.usbmodem14101',9600)
counter = 0
output,output_backup = [],[]


# Aqui se comienza un bucle para recivir constantemente
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
            # si rawString ha cambiado de su posicion anterior,
            # se entra a esta parte de codigo, se imprime en 
            # consola el codigo encontrado y se hace un HTTP
            # request a los sockets del servidor remoto.
            print ('-'.join(str(e) for e in output))
            sio.emit('message', '-'.join(str(e) for e in output))
            output_backup = output
        output = []
        counter = 0
arduino.close()