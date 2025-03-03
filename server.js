require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const Queue = require('bull');

const app = express();
const PORT = process.env.PORT;
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static('public'));



// Configuración de Redis con fallback
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const pdfQueue = new Queue('pdf-generation', REDIS_URL);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Para servir archivos estáticos si es necesario

// Verificar conexión a Redis
pdfQueue.on('error', (err) => {
    console.error('❌ Error con Redis:', err);
    console.error('⚠️ Asegúrate de que Redis esté corriendo con "redis-server" antes de iniciar el servidor.');
});


// Ruta para recibir JSON y generar HTML dinámico
app.post('/generate-html', async (req, res) => {
    try {
        const data = req.body;
        const templatePath = path.join(__dirname, 'templates', 'template.ejs');




        // Verificar si el archivo existe
        if (!fs.existsSync(templatePath)) {
            console.error('❌ Error: No se encontró el archivo template.ejs');
            return res.status(500).send('Error interno: Falta el archivo template.ejs');
        }

        // Leer la plantilla EJS
        const template = fs.readFileSync(templatePath, 'utf8');
        const html = ejs.render(template, { data });

        res.send(html);
    } catch (error) {
        console.error('Error generando HTML:', error);
        res.status(500).send('Error generando HTML');
    }
});

const jobs = new Map(); // Almacenar trabajos en progreso

app.post('/generate-pdf', async (req, res) => {
    try {
        console.log('📥 Recibiendo solicitud para generar PDF, agregando a la cola...');

        // Agregar la solicitud a la cola y obtener un Job (trabajo)
        const job = await pdfQueue.add(req.body);

        // Almacenar la respuesta de la solicitud en un mapa usando el Job ID
        jobs.set(job.id, res);

    } catch (error) {
        console.error('❌ Error en la solicitud de PDF:', error);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

pdfQueue.process(2, async (job, done) => { // Procesar 2 PDFs al mismo tiempo
    try {
        console.log(`⚙ Procesando solicitud de PDF (${job.id})...`);

        const data = job.data;
        const templatePath = path.join(__dirname, 'templates', 'template.ejs');


        if (!fs.existsSync(templatePath)) {
            console.error('❌ Error: No se encontró el archivo template.ejs');
            return done(new Error('Falta el archivo template.ejs'));
        }

        // Leer la plantilla y generar HTML
        const template = fs.readFileSync(templatePath, 'utf8');
        const html = ejs.render(template, { data });

        // Generar el PDF con Puppeteer
     const browser = await puppeteer.launch({
    headless: 'new', // Para mejor rendimiento en entornos modernos
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',  // Evita problemas en entornos con poca memoria
        '--disable-gpu', // Render no usa GPU, así que lo desactivamos
        '--single-process' // Asegura estabilidad en contenedores
    ]
});



        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'letter',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();
        console.log(`✅ PDF generado (${job.id}).`);

        // Recuperar la respuesta del cliente y enviarle el PDF
        const res = jobs.get(job.id);
        if (res) {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="documento.pdf"',
                'Content-Length': pdfBuffer.length
            });
            res.end(pdfBuffer); // Enviar el PDF como respuesta
            jobs.delete(job.id); // Eliminar el trabajo del mapa
        }

        done(null, pdfBuffer);

    } catch (error) {
        console.error(`❌ Error generando PDF (${job.id}):`, error);
        done(error);
    }
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
