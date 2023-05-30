// não altere!
const serialport = require('serialport');
const express = require('express');
const mysql = require('mysql2');
const sql = require('mssql');

// não altere!
const SERIAL_BAUD_RATE = 9600;
const SERVIDOR_PORTA = 3300;

// configure a linha abaixo caso queira que os dados capturados sejam inseridos no banco de dados.
// false -> nao insere
// true -> insere
const HABILITAR_OPERACAO_INSERIR = true;

// altere o valor da variável AMBIENTE para o valor desejado:
// API conectada ao banco de dados remoto, SQL Server -> 'producao'
// API conectada ao banco de dados local, MySQL Workbench - 'desenvolvimento'
const AMBIENTE = 'desenvolvimento';

const serial = async (
    valoresCaminhao01,
    valoresCaminhao02,
    valoresCaminhao03,
    valoresCaminhao04,

) => {
    let poolBancoDados = ''

    if (AMBIENTE == 'desenvolvimento') {
        poolBancoDados = mysql.createPool(
            {
                // altere!
                // CREDENCIAIS DO BANCO LOCAL - MYSQL WORKBENCH
                host: 'localhost',
                user: 'root',
                password: 'cimento12345',
                database:  'ast'
            }
        ).promise();
    } else if (AMBIENTE == 'producao') {
        console.log('Projeto rodando inserindo dados em nuvem. Configure as credenciais abaixo.');
    } else {
        throw new Error('Ambiente não configurado. Verifique o arquivo "main.js" e tente novamente.');
    }

    const portas = await serialport.SerialPort.list();
    const portaArduino = portas.find((porta) => porta.vendorId == 2341 && porta.productId == 43);
    if (!portaArduino) {
        throw new Error('O arduino não foi encontrado em nenhuma porta serial');
    }
    const arduino = new serialport.SerialPort(
        {
            path: portaArduino.path,
            baudRate: SERIAL_BAUD_RATE
        }
    );
    arduino.on('open', () => {
        console.log(`A leitura do arduino foi iniciada na porta ${portaArduino.path} utilizando Baud Rate de ${SERIAL_BAUD_RATE}`);
    });
    arduino.pipe(new serialport.ReadlineParser({ delimiter: '\r\n' })).on('data', async (data) => {
        console.log(data);
        const valores = data.split(';');
        const temp_caminhao01 = parseFloat(valores[0]);
        const temp_caminhao02 = parseFloat(valores[0]);
        const temp_caminhao03 = parseFloat(valores[0]);
        const temp_caminhao04 = parseFloat(valores[0]);

        valoresCaminhao01.push(temp_caminhao01);
        valoresCaminhao02.push(temp_caminhao02);
        valoresCaminhao03.push(temp_caminhao03);
        valoresCaminhao04.push(temp_caminhao04);



        if (HABILITAR_OPERACAO_INSERIR) {
         if (AMBIENTE == 'desenvolvimento') {
                console.log(temp_caminhao01);
                console.log(temp_caminhao02);
                console.log(temp_caminhao03);
                console.log(temp_caminhao04);

                // altere!
                // Este insert irá inserir os dados na tabela "medida"
                // -> altere nome da tabela e colunas se necessário
                // Este insert irá inserir dados de fk_aquario id=1 (fixo no comando do insert abaixo)
                // >> você deve ter o aquario de id 1 cadastrado.
                await poolBancoDados.execute(
                    'INSERT INTO historicoLeitura (registro_sensor, status_transporte, data_hora, fkSensor, fkTemperaturaTransporte) VALUES (?, "Em trânsito", now(), 12022003, 1)',
                    [temp_caminhao01],
                    'INSERT INTO historicoLeitura (registro_sensor, status_transporte, data_hora, fkSensor, fkTemperaturaTransporte) VALUES (?, "Em trânsito", now(), 12022003, 1)',
                    [temp_caminhao02],
                    'INSERT INTO historicoLeitura (registro_sensor, status_transporte, data_hora, fkSensor, fkTemperaturaTransporte) VALUES (?, "Em trânsito", now(), 12022003, 2)',
                    [temp_caminhao03],
                    'INSERT INTO historicoLeitura (registro_sensor, status_transporte, data_hora, fkSensor, fkTemperaturaTransporte) VALUES (?, "Em trânsito", now(), 12022003, 4)',
                    [temp_caminhao04],
                );
                console.log("valores inseridos no banco: ", temp_caminhao01);
                console.log("valores inseridos no banco: ", temp_caminhao02);
                console.log("valores inseridos no banco: ", temp_caminhao03);
                console.log("valores inseridos no banco: ", temp_caminhao04);

            } else {
                throw new Error('Ambiente não configurado. Verifique o arquivo "main.js" e tente novamente.');
            }
        }
    });
    arduino.on('error', (mensagem) => {
        console.error(`Erro no arduino (Mensagem: ${mensagem}`)
    });
}

(async () => {
    const valoresCaminhao01 = [];
    const valoresCaminhao02 = [];
    const valoresCaminhao03 = [];
    const valoresCaminhao04 = [];

    await serial(
        valoresCaminhao01,
        valoresCaminhao02,
        valoresCaminhao03,
        valoresCaminhao04,
    );
})();
