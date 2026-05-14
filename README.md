# 🧠 Analisador Circumplex de Russell — Bioacoustic Module

O **Analisador Circumplex** é um módulo de análise de dados em tempo real que utiliza o modelo psicológico de James Russell para mapear estados afetivos. A ferramenta processa entradas de áudio e extrai características bioacústicas para posicionar a "emoção" do som em um gráfico de dois eixos: **Valência** (Prazer vs. Desprazer) e **Alerta** (Ativação vs. Desativação).

## 🚀 Funcionalidades Técnicas

- **Mapeamento de Eixos:** Visualização precisa de estados emocionais (ex: *Excited, Relaxed, Depressed, Angry*) baseada em coordenadas cartesianas.
- **Extração de Features Acústicas:** O sistema analisa o sinal de áudio em tempo real, extraindo:
  - **RMS (Root Mean Square):** Para medir a energia e intensidade.
  - **ZCR (Zero Crossing Rate):** Para identificar ruído e percussividade.
  - **Spectral Centroid:** Para medir o "brilho" do som.
- **Interface High-Fidelity:** Design inspirado em terminais de laboratório, com esquema de cores *Cyan & Black*, focado em legibilidade de dados técnicos.
- **Integração Bioacústica:** Módulo projetado para servir de "cérebro" para motores de composição procedural (como o CHIP·GEN), permitindo que a música responda a estados emocionais específicos.

## 🛠️ Tecnologias Utilizadas

- **Web Audio API:** Para captura de microfone ou arquivos e processamento de sinal digital (DSP).
- **HTML5 Canvas:** Renderização do gráfico dinâmico e dos medidores de frequência.
- **Vanilla JavaScript:** Lógica matemática para conversão de features de áudio em coordenadas do modelo de Russell.
- **CSS Grid/Flexbox:** Interface responsiva de alta fidelidade estilo terminal.

## 📊 Como Funciona o Modelo

1. **Eixo X (Valência):** Define se a emoção é positiva (alegria, serenidade) ou negativa (tristeza, raiva).
2. **Eixo Y (Alerta/Arousal):** Define a intensidade. Valores altos indicam agitação/alerta, valores baixos indicam calma/sonolência.
3. **O Resultado:** O ponto de intersecção revela o estado emocional predominante no áudio analisado.

---
Desenvolvido por [Jjunninho](https://github.com/Jjunninho)
