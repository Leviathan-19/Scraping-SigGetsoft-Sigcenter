import { loginSigcenter } from './scrapers/sigcenter';
import { loginGetsoft } from './scrapers/getsoft';
import { logger } from './utils/logger';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';

  logger.info(`Iniciando proceso con comando: ${command}`);

  try {
    if (command === 'sigcenter' || command === 'full') {
      const { browser } = await loginSigcenter();
      logger.info('Proceso de inicio de sesión de Sigcenter completado con éxito.');
      await browser.close();
    }

    if (command === 'getsoft' || command === 'full') {
      const { browser } = await loginGetsoft();
      logger.info('Proceso de inicio de sesión de Getsoft completado con éxito.');
      await browser.close();
    }
    
    logger.info('Todas las tareas solicitadas completadas.');
  } catch (error) {
    logger.error('Fallo en la ejecución:', error);
    process.exit(1);
  }
}

main();
