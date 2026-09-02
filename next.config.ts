import os from 'os';
import path from 'path';

// Solo en desarrollo local: el proyecto vive en un disco NTFS montado con "force"
// (Windows no cerró limpio), y el driver ntfs3 falla borrando archivos ahi durante
// el hot-reload. Se saca el build cache al disco ext4 nativo para evitarlo.
// En Vercel/CI se deja el distDir por defecto (".next"), que es lo que esas
// plataformas esperan encontrar.
const esEntornoLocal = !process.env.VERCEL && !process.env.CI;

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(esEntornoLocal && {
    distDir: path.join(os.homedir(), '.cache', 'next-builds', 'control-gastos-nextjs')
  })
}

module.exports = nextConfig
