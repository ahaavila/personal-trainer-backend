import { comparePassword, hashPassword } from './password.js';

describe('password helpers', () => {
  it('accepts the password used to create a hash', async () => {
    const passwordHash = await hashPassword('personal123');

    await expect(comparePassword('personal123', passwordHash)).resolves.toBe(
      true,
    );
  });

  it('rejects a different password', async () => {
    const passwordHash = await hashPassword('personal123');

    await expect(comparePassword('incorrect-password', passwordHash)).resolves.toBe(
      false,
    );
  });
});