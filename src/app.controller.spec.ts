import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  const appService = new AppService();
  const appController = new AppController(appService);

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return service status payload', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'personal-trainer-backend',
      });
    });
  });
});
