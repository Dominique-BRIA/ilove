import type { NextConfig } from "next";

// Les photos et la vidéo vont directement du navigateur vers Backblaze B2 : les
// actions serveur ne reçoivent que du texte et restent sous la limite de 1 Mo.
const config: NextConfig = {};

export default config;
