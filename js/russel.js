        // Mapeamento de emoções no Circumplex
        const emocoesCircumplex = {
            // Q1: Alta ativação + Valência positiva
            'excitacao': { nome: 'Excitação', desc: 'Energia alta, emoção positiva', range: { v: [0.3, 1], a: [0.6, 1] }, emoji: '🎉' },
            'alegria': { nome: 'Alegria', desc: 'Felicidade energética', range: { v: [0.5, 1], a: [0.5, 0.8] }, emoji: '😄' },
            
            // Q2: Alta ativação + Valência negativa  
            'tensao': { nome: 'Tensão', desc: 'Energia alta, emoção negativa', range: { v: [-1, -0.3], a: [0.6, 1] }, emoji: '😰' },
            'raiva': { nome: 'Raiva', desc: 'Agressividade, hostilidade', range: { v: [-1, -0.5], a: [0.7, 1] }, emoji: '😡' },
            
            // Q3: Baixa ativação + Valência negativa
            'tristeza': { nome: 'Tristeza', desc: 'Melancolia, depressão', range: { v: [-1, -0.3], a: [0, 0.4] }, emoji: '😢' },
            'depressao': { nome: 'Depressão', desc: 'Baixa energia, emoção negativa', range: { v: [-1, -0.5], a: [0, 0.3] }, emoji: '😔' },
            
            // Q4: Baixa ativação + Valência positiva
            'calma': { nome: 'Calma', desc: 'Serenidade, paz', range: { v: [0.3, 1], a: [0, 0.4] }, emoji: '😌' },
            'serenidade': { nome: 'Serenidade', desc: 'Contentamento tranquilo', range: { v: [0.5, 1], a: [0, 0.3] }, emoji: '🧘' },
            
            // Centro
            'neutro': { nome: 'Neutro', desc: 'Emocionalmente equilibrado', range: { v: [-0.3, 0.3], a: [0.4, 0.6] }, emoji: '😐' }
        };

        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const audioPlayer = document.getElementById('audioPlayer');
        const playerContainer = document.getElementById('playerContainer');
        const resultado = document.getElementById('resultado');
        const loading = document.getElementById('loading');

        // Upload handlers
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.includes('audio')) {
                processarMusica(file);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                processarMusica(file);
            }
        });

        async function processarMusica(file) {
            // Mostrar player
            const url = URL.createObjectURL(file);
            audioPlayer.src = url;
            playerContainer.style.display = 'block';

            // Mostrar loading
            loading.style.display = 'block';
            resultado.style.display = 'none';

            try {
                // Análise de áudio com Meyda
                const features = await analisarAudioComMeyda(file);
                
                // Calcular valência e arousal
                const { valence, arousal } = calcularCircumplex(features);
                
                // Identificar emoção
                const emocao = identificarEmocao(valence, arousal);
                
                // Exibir resultados
                exibirResultado(valence, arousal, emocao, features);
                
                loading.style.display = 'none';
                resultado.style.display = 'block';
            } catch (error) {
                console.error('Erro na análise:', error);
                alert('Erro ao analisar a música. Tente outro arquivo.');
                loading.style.display = 'none';
            }
        }

        async function analisarAudioComMeyda(file) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Extrair canal (mono)
            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;

            // Análise em janelas usando Meyda
            const windowSize = 512;
            const hopSize = 256;
            const numWindows = Math.floor((channelData.length - windowSize) / hopSize);

            let rmsSum = 0;
            let centroidSum = 0;
            let zcrSum = 0;
            let fluxSum = 0;
            let validWindows = 0;

            for (let i = 0; i < Math.min(numWindows, 500); i++) { // Limitar a 500 janelas para performance
                const start = i * hopSize;
                const window = channelData.slice(start, start + windowSize);

                try {
                    const features = Meyda.extract([
                        'rms',
                        'spectralCentroid',
                        'zcr',
                        'energy'
                    ], window);

                    if (features && features.rms && !isNaN(features.rms)) {
                        rmsSum += features.rms;
                        centroidSum += features.spectralCentroid || 0;
                        zcrSum += features.zcr || 0;
                        fluxSum += features.energy || 0;
                        validWindows++;
                    }
                } catch (e) {
                    // Ignora erros silenciosamente
                }
            }

            if (validWindows === 0) {
                throw new Error('Não foi possível extrair features do áudio');
            }

            return {
                rms: rmsSum / validWindows,
                spectralCentroid: centroidSum / validWindows,
                zcr: zcrSum / validWindows,
                energy: fluxSum / validWindows
            };
        }

        function normalizar(valor, min, max) {
            return Math.max(0, Math.min(1, (valor - min) / (max - min)));
        }

        function calcularCircumplex(features) {
            // Normalização baseada em valores típicos
            const rmsNorm = normalizar(features.rms, 0, 0.3);
            const centroidNorm = normalizar(features.spectralCentroid, 0, 3000);
            const zcrNorm = normalizar(features.zcr, 0, 0.3);
            const fluxNorm = normalizar(features.spectralFlux, 0, 100);

            // AROUSAL: Combinação de energia, agitação e mudança
            // Alta energia + alta agitação = alto arousal
            const arousal = Math.min(1, 
                0.4 * rmsNorm + 
                0.3 * zcrNorm + 
                0.3 * normalizar(features.energy, 0, 0.3)
            );

            // VALÊNCIA: Baseado em brilho espectral
            // Centroid alto = som mais brilhante = geralmente mais positivo
            // Centroid baixo = som mais escuro = geralmente mais negativo
            let valence = (centroidNorm - 0.5) * 2; // Mapeia 0-1 para -1 a 1
            
            // Ajuste: se RMS é muito alta e centroid baixo, provavelmente é música pesada (negativa)
            if (rmsNorm > 0.6 && centroidNorm < 0.4) {
                valence -= 0.3;
            }
            
            // Ajuste: se RMS é baixa e flux é baixo, provavelmente é calma (positiva se centroid médio)
            if (rmsNorm < 0.3 && fluxNorm < 0.3 && centroidNorm > 0.3) {
                valence += 0.2;
            }

            // Limitar valência entre -1 e 1
            valence = Math.max(-1, Math.min(1, valence));

            return { valence, arousal };
        }

        function identificarEmocao(valence, arousal) {
            // Identificar qual emoção melhor descreve as coordenadas
            let melhorEmocao = 'neutro';
            let melhorScore = 0;

            for (const [key, emocao] of Object.entries(emocoesCircumplex)) {
                const vInRange = valence >= emocao.range.v[0] && valence <= emocao.range.v[1];
                const aInRange = arousal >= emocao.range.a[0] && arousal <= emocao.range.a[1];
                
                if (vInRange && aInRange) {
                    // Calcular quão centrado está no range
                    const vCenter = (emocao.range.v[0] + emocao.range.v[1]) / 2;
                    const aCenter = (emocao.range.a[0] + emocao.range.a[1]) / 2;
                    const distancia = Math.sqrt(
                        Math.pow(valence - vCenter, 2) + 
                        Math.pow(arousal - aCenter, 2)
                    );
                    const score = 1 / (distancia + 0.1);
                    
                    if (score > melhorScore) {
                        melhorScore = score;
                        melhorEmocao = key;
                    }
                }
            }

            return emocoesCircumplex[melhorEmocao];
        }

        function desenharCircumplex(valence, arousal) {
            const canvas = document.getElementById('circumplex');
            const ctx = canvas.getContext('2d');
            const size = 500;
            
            // Ajustar para alta resolução
            canvas.width = size;
            canvas.height = size;
            
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size * 0.4;

            // Limpar
            ctx.clearRect(0, 0, size, size);

            // Desenhar fundo dos quadrantes
            // Q1 (direita superior) - Excitação
            ctx.fillStyle = 'rgba(255, 224, 130, 0.3)';
            ctx.fillRect(centerX, 0, centerX, centerY);
            
            // Q2 (esquerda superior) - Tensão
            ctx.fillStyle = 'rgba(255, 205, 210, 0.3)';
            ctx.fillRect(0, 0, centerX, centerY);
            
            // Q3 (esquerda inferior) - Tristeza
            ctx.fillStyle = 'rgba(197, 202, 233, 0.3)';
            ctx.fillRect(0, centerY, centerX, centerY);
            
            // Q4 (direita inferior) - Calma
            ctx.fillStyle = 'rgba(200, 230, 201, 0.3)';
            ctx.fillRect(centerX, centerY, centerX, centerY);

            // Desenhar círculo
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Desenhar eixos
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, 20);
            ctx.lineTo(centerX, size - 20);
            ctx.moveTo(20, centerY);
            ctx.lineTo(size - 20, centerY);
            ctx.stroke();

            // Labels dos eixos
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Alto Arousal', centerX, 15);
            ctx.fillText('Baixo Arousal', centerX, size - 5);
            
            ctx.save();
            ctx.translate(10, centerY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Valência Negativa', 0, 0);
            ctx.restore();
            
            ctx.save();
            ctx.translate(size - 10, centerY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Valência Positiva', 0, 0);
            ctx.restore();

            // Converter coordenadas do modelo para canvas
            // valence: -1 (esquerda) a 1 (direita)
            // arousal: 0 (baixo) a 1 (alto)
            const x = centerX + (valence * radius);
            const y = centerY - (arousal * radius * 2 - radius); // Inverter Y

            // Desenhar ponto
            ctx.fillStyle = '#FF4081';
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.stroke();

            // Desenhar linhas de coordenadas
            ctx.strokeStyle = 'rgba(255, 64, 129, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, centerY);
            ctx.lineTo(x, y);
            ctx.moveTo(centerX, y);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        function exibirResultado(valence, arousal, emocao, features) {
            // Atualizar emoção
            document.getElementById('emocaoNome').textContent = `${emocao.emoji} ${emocao.nome}`;
            document.getElementById('emocaoDesc').textContent = emocao.desc;
            document.getElementById('valencia').textContent = valence.toFixed(2);
            document.getElementById('arousal').textContent = arousal.toFixed(2);

            // Desenhar circumplex
            desenharCircumplex(valence, arousal);

            // Atualizar features
            const rmsNorm = normalizar(features.rms, 0, 0.3);
            const centroidNorm = normalizar(features.spectralCentroid, 0, 3000);
            const zcrNorm = normalizar(features.zcr, 0, 0.3);
            const energyNorm = normalizar(features.energy, 0, 0.3);

            document.getElementById('valRMS').textContent = features.rms.toFixed(3);
            document.getElementById('barRMS').style.width = (rmsNorm * 100) + '%';

            document.getElementById('valCentroid').textContent = features.spectralCentroid.toFixed(1) + ' Hz';
            document.getElementById('barCentroid').style.width = (centroidNorm * 100) + '%';

            document.getElementById('valFlux').textContent = features.energy.toFixed(3);
            document.getElementById('barFlux').style.width = (energyNorm * 100) + '%';

            document.getElementById('valZCR').textContent = features.zcr.toFixed(3);
            document.getElementById('barZCR').style.width = (zcrNorm * 100) + '%';
        }