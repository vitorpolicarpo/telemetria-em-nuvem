# ☁️ Plataforma de Telemetria em Nuvem

## 📌 Sobre o projeto

Este projeto consiste no desenvolvimento de uma plataforma de registro, armazenamento e análise de dados de telemetria utilizando computação em nuvem.

A proposta é permitir que dados reais obtidos durante testes de um veículo ou sistema experimental sejam inseridos na plataforma, armazenados de forma centralizada e posteriormente analisados e comparados entre diferentes sessões de teste.

O projeto tem como foco principal demonstrar como a computação em nuvem pode solucionar problemas relacionados ao armazenamento, acesso, organização e análise de dados de telemetria.

---

## 🎯 Objetivos

O projeto busca desenvolver uma solução capaz de:

- Registrar dados reais de telemetria;
- Organizar os dados por sessões de teste;
- Permitir acesso remoto aos dados;
- Manter um histórico dos testes realizados;
- Comparar dados de diferentes sessões;
- Gerar visualizações e gráficos;
- Identificar possíveis comportamentos anormais;

---

## ☁️ Por que utilizamos Computação em Nuvem?

A utilização da computação em nuvem é o principal diferencial do projeto.

Em uma solução totalmente local, os dados poderiam ficar armazenados em um único computador. Isso cria algumas limitações:

- Dependência de uma máquina específica;
- Dificuldade de acesso remoto;
- Dificuldade para compartilhar os dados;
- Limitações de armazenamento;
- Maior dificuldade para centralizar informações de vários testes.

A computação em nuvem permite que os dados sejam enviados para uma infraestrutura remota e centralizada, possibilitando que diferentes usuários e dispositivos tenham acesso às mesmas informações.

---

## 🧪 Obtenção e organização dos dados

Os dados serão obtidos a partir de medições reais realizadas durante os testes e inseridos no sistema pelo usuário. Entre os dados que poderão ser registrados temos velocidade, tensão, temperatura, tempo, aceleração dentre outros.

Cada conjunto de medições será associado a uma sessão de teste, permitindo posteriormente realizar comparações entre diferentes testes. Para evitar que os dados fiquem desorganizados, cada teste será registrado individualmente. Exemplo:

Teste 01
├── Data
├── Veículo
├── Descrição
└── Medições
    ├── Medição 1
    ├── Medição 2
    ├── Medição 3
    └── ...

Teste 02
├── Data
├── Veículo
├── Descrição
└── Medições
    ├── Medição 1
    ├── Medição 2
    └── ...

Essa organização permitirá comparar diferentes sessões e identificar alterações no comportamento do sistema.

---

## 🛠️ Tecnologias utilizadas

### Python: 

Será utilizado principalmente no backend e na manipulação dos dados, na comunicação com a API e no processamento de dados.

### FastAPI

O FastAPI será utilizado para desenvolver a API responsável pela comunicação entre a interface e o banco de dados. A API receberá os dados enviados pelo usuário, validará as informações e realizará o armazenamento no banco de dados.

### PostgreSQL

O PostgreSQL será utilizado como banco de dados da aplicação. Ele será responsável por armazenar informações das sessões de teste, data e horário das medições, dados de velocidade, temperatura, tensão, aceleração, dentre outros quesitos que podem ser adicionados pelo usuário. 

### HTML, CSS e JS

O frontend será responsável pela interação com o usuário. HTML é responsável pela estrutura das páginas e formulários. CSS é responsável pela organização visual e apresentação da aplicação. JavaScript é responsável por: enviar dados para a API, consultar informações, atualizar o dashboard, construir gráficos e realizar comparações.

---

### 📊 Dashboard

O dashboard será utilizado para transformar os dados armazenados em informações visualmente úteis. O usuário poderá selecionar uma sessão de teste e visualizar informações como velocidade máxima, temperatura máxima e média, tensão mínima, aceleração, evolução dos parâmetros ao longo do tempo, etc. 

Também será possível comparar diferentes sessões. Exemplo:

                             TESTE 01     TESTE 02 
                             
              Velocidade      82 km/h      91 km/h
              Temp. máxima    72 °C        78 °C
              Temp. média     61 °C        65 °C
              Tensão mínima   11,8 V       11,5 V

Além disso, poderão ser utilizados gráficos como:

- Velocidade × Tempo;
- Temperatura × Tempo;
- Tensão × Tempo;
- Aceleração × Tempo;
- Velocidade × Temperatura.



