-- Limpeza de estrutura (caso fique com dados sujos)
-- No postegre, quando inicializa e re-executa o código,
-- ele executa de novo linha a linha, então ficariam tabelas
-- duplicadas e com dados duplicados (porque também re-executaria
-- os inserts)
DROP TABLE IF EXISTS telemetria_motor, sessoes_teste, veiculos CASCADE;

-- Infos do carro
-- Funciona como uma ficha técnica
CREATE TABLE veiculos ( 
    id_car SERIAL PRIMARY KEY,  
    model VARCHAR(50) UNIQUE NOT NULL,
    peso NUMERIC(6,2) 
);

-- Tabela de Sessões de Teste
-- Organiza p/ Teste -> Data, Veículo, Descrição
CREATE TABLE sessoes_teste (
    id_sessao SERIAL PRIMARY KEY,
    nome_teste VARCHAR(50) UNIQUE NOT NULL, -- Ex: 'Teste 01', 'Teste 02'
    id_car INTEGER REFERENCES veiculos(id_car),
    data_teste DATE NOT NULL,
    descricao TEXT
);

-- Tabela de telemetria
-- Telemetria se liga à sessão, não ao carro
CREATE TABLE telemetria_motor (
    id_registro SERIAL PRIMARY KEY, 
    id_sessao INTEGER REFERENCES sessoes_teste(id_sessao), 
    time INTEGER NOT NULL, 
    speed NUMERIC(5,2), 
    motor_temp NUMERIC(5,2), 
    tensao NUMERIC(5,2), -- Nova coluna exigida pelo README para o Dashboard
    accel NUMERIC(5,2), 
    CONSTRAINT sessao_time_unico UNIQUE(id_sessao, time) -- Regra atualizada
);

-- 4. Inserção de Veículos
INSERT INTO veiculos (model, peso) VALUES 
('Toyota Corolla XEI 2003', 1160.00),
('Protótipo Elétrico Alpha', 310.50)
ON CONFLICT (model) DO NOTHING;

-- Inserção de Sessões de Teste
INSERT INTO sessoes_teste (nome_teste, id_car, data_teste, descricao) VALUES
('Teste 01', 1, '2026-09-21', 'Teste de arrancada em pista seca'),
('Teste 02', 1, '2026-09-22', 'Teste de resistência térmica do motor')
ON CONFLICT (nome_teste) DO NOTHING;

-- Inserção das Medições (Teste 01 - id_sessao = 1)
INSERT INTO telemetria_motor (id_sessao, time, speed, motor_temp, tensao, accel) 
VALUES 
(1, 1, 22.00, 61.00, 12.10, 6.10),    
(1, 2, 43.00, 65.50, 11.90, 5.80),    
(1, 3, 58.00, 72.00, 11.80, 4.32),     
(1, 4, 70.00, 78.50, 11.50, 3.33)      
ON CONFLICT (id_sessao, time) 
DO UPDATE SET 
    speed = EXCLUDED.speed,
    motor_temp = EXCLUDED.motor_temp,
    tensao = EXCLUDED.tensao,
    accel = EXCLUDED.accel;


-- Consulta 1 para o Dashboard
SELECT 
    s.nome_teste AS "Sessão",
    MAX(t.speed) AS "Velocidade Máx (km/h)",
    MAX(t.motor_temp) AS "Temp Máx (°C)",
    ROUND(AVG(t.motor_temp), 1) AS "Temp Média (°C)",
    MIN(t.tensao) AS "Tensão Mínima (V)"
FROM sessoes_teste s
JOIN telemetria_motor t ON s.id_sessao = t.id_sessao
GROUP BY s.nome_teste;

-- Inserção de medidas (Teste 02 - id_sessao = 2)
INSERT INTO telemetria_motor (id_sessao, time, speed, motor_temp, tensao, accel) 
VALUES 
(2, 1, 30.00, 62.00, 11.90, 7.10),    
(2, 2, 55.00, 68.50, 11.70, 6.80),    
(2, 3, 75.00, 75.00, 11.60, 5.32),     
(2, 4, 91.00, 80.50, 11.40, 4.33)      
ON CONFLICT (id_sessao, time) 
DO UPDATE SET 
    speed = EXCLUDED.speed,
    motor_temp = EXCLUDED.motor_temp,
    tensao = EXCLUDED.tensao,
    accel = EXCLUDED.accel;

-- Consulta 2 para o Dashboard (Comparação)
SELECT 
    s.nome_teste AS "Sessão",
    MAX(t.speed) AS "Velocidade Máx (km/h)",
    MAX(t.motor_temp) AS "Temp Máx (°C)",
    ROUND(AVG(t.motor_temp), 1) AS "Temp Média (°C)",
    MIN(t.tensao) AS "Tensão Mínima (V)"
FROM sessoes_teste s
JOIN telemetria_motor t ON s.id_sessao = t.id_sessao
GROUP BY s.nome_teste
ORDER BY s.nome_teste;

-- Consulta 3 (velocidade x tempo)
SELECT 
    s.nome_teste,
    t.time AS tempo_s,
    t.speed AS velocidade_kmh
FROM telemetria_motor t
JOIN sessoes_teste s ON t.id_sessao = s.id_sessao
ORDER BY t.time ASC, s.nome_teste ASC;
