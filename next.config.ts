import os from 'os';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // El proyecto vive en un disco NTFS montado con "force" (Windows no cerró limpio),
  // y el driver ntfs3 falla borrando archivos ahi durante el hot-reload. Se saca el
  // build cache al disco ext4 nativo para evitar los errores EACCES intermitentes.
  distDir: path.join(os.homedir(), '.cache', 'next-builds', 'control-gastos-nextjs')
}

module.exports = nextConfig
