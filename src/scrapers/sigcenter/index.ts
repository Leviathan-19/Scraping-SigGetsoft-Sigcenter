import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const SESSION_DIR = path.resolve(process.cwd(), 'sessions');
const SESSION_FILE = path.join(SESSION_DIR, 'sigcenter.json');

export async function loginSigcenter() {
  logger.info('Iniciando scraper de SigCenter...');
  
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: env.HEADLESS,
  });

  let context: BrowserContext;
  let page: Page;

  try {
    if (fs.existsSync(SESSION_FILE)) {
      logger.info('Se encontró una sesión existente para SigCenter, intentando reutilizar...');
      context = await browser.newContext({
        storageState: SESSION_FILE,
        ignoreHTTPSErrors: true // Requerido para certificados autofirmados o inválidos en ddns.net
      });
      page = await context.newPage();
      
      await page.goto('https://sigcenter.ddns.net:8070/', { timeout: env.TIMEOUT });
      
      // Si no somos redirigidos a la página de inicio de sesión, es probable que la sesión aún sea válida
      if (!page.url().includes('/site/login')) {
        logger.info('¡La sesión aún es válida!');
        return { browser, context, page };
      } else {
        logger.warn('La sesión expiró. Se realizará el inicio de sesión nuevamente.');
        await context.close();
      }
    }

    logger.info('Realizando nuevo inicio de sesión en SigCenter...');
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();

    await page.goto('https://sigcenter.ddns.net:8070/site/login', { timeout: env.TIMEOUT });
    
    // Intentamos completar el usuario y la contraseña usando selectores estándar de Yii2, como alternativa usamos los tipos de input
    const usernameInput = page.locator('#loginform-username').or(page.locator('input[type="text"]').first());
    const passwordInput = page.locator('#loginform-password').or(page.locator('input[type="password"]').first());
    const submitBtn = page.locator('button[type="submit"]').first();

    await usernameInput.fill(env.SIGCENTER_USER);
    await passwordInput.fill(env.SIGCENTER_PASSWORD);
    await submitBtn.click();

    // Esperar a que la aplicación navegue después del inicio de sesión
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/site/login')) {
      throw new Error('Fallo el inicio de sesión. Por favor verifica tus credenciales en .env.');
    }

    logger.info('¡Inicio de sesión exitoso! Guardando estado de la sesión...');
    await context.storageState({ path: SESSION_FILE });
    
    return { browser, context, page };
  } catch (error) {
    logger.error('Error durante el inicio de sesión en SigCenter:', error);
    await browser.close();
    throw error;
  }
}
