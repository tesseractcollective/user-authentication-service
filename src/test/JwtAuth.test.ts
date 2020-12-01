import { PasswordHash } from "@tesseractcollective/serverless-toolbox";
import { validate as uuidValidate } from 'uuid';

import JwtAuth, { UserIdBox, TicketBox, User } from "../JwtAuth";
import { MockObjectStore } from "./MockObjectStore";

const testEmail = 'test@example.com';
const testPassword = 'test-password';
const testRole = 'test-role';

function createJwtAuth(): JwtAuth {
  const secret = 'test-secret';
  const passwordStore = new MockObjectStore<PasswordHash>();
  const expiringTicketStore = new MockObjectStore<TicketBox>(0.1);
  const emailMapStore = new MockObjectStore<UserIdBox>();
  const userStore = new MockObjectStore<User>();
  return new JwtAuth(passwordStore, expiringTicketStore, emailMapStore, userStore, secret);
}

async function createAuthAndUser(): Promise<{ auth: JwtAuth, user: User }> {
  const auth = createJwtAuth();
  const user = await auth.createUser(testEmail, testPassword, testRole);
  return { auth, user };
}

async function sleep(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

describe('JwtAuth', () => {
  it('should create a user', async () => {
    const { user } = await createAuthAndUser();
    expect(user.email).toEqual(testEmail);
    expect(uuidValidate(user.id)).toStrictEqual(true);
  });

  it('should get a user by email', async () => {
    const { auth, user } = await createAuthAndUser();
    const fetchedUser = await auth.getUserWithEmail(user.email);
    expect(user.id).toEqual(fetchedUser?.id);
  });

  it('should get a user by email and password', async () => {
    const { auth, user } = await createAuthAndUser();
    const fetchedUser = await auth.getUserWithEmailPassword(user.email, testPassword);
    expect(user.id).toEqual(fetchedUser?.id);
  });

  it('should get a user by id', async () => {
    const { auth, user } = await createAuthAndUser();
    const fetchedUser = await auth.getUser(user.id);
    expect(user.id).toEqual(fetchedUser?.id);
  });

  it('should delete a user', async () => {
    const { auth, user } = await createAuthAndUser();
    await auth.deleteUser(user.email);

    const deletedUser = auth.getUserWithEmail(user.email);
    expect(deletedUser).toBeUndefined;
  });

  it ('should create a password reset ticket', async () => {
    const { auth, user } = await createAuthAndUser();
    const ticket = await auth.addPasswordResetTicket(user.email);
    expect(ticket.length).toEqual(21);
  });

  it('should update a password', async () => {
    const { auth, user } = await createAuthAndUser();
    const ticket = await auth.addPasswordResetTicket(user.email);
    const updatedPassword = 'updatedPassword';
    await auth.updatePassword(testEmail, updatedPassword, ticket);

    const updatedUser = await auth.getUserWithEmailPassword(testEmail, updatedPassword);
    expect(updatedUser?.id).toEqual(user.id);
  });

  it('should not update a password if ticket has expired', async () => {
    const { auth, user } = await createAuthAndUser();
    const ticket = await auth.addPasswordResetTicket(user.email);
    await sleep(200);

    let errorMessage: string | undefined;
    try {
      const updatedPassword = 'updatedPassword';
      await auth.updatePassword(testEmail, updatedPassword, ticket);
    } catch(error) {
      errorMessage = error.message;
    }
    expect(errorMessage?.includes('expired')).toStrictEqual(true);
  });

  it('should create an email verify ticket', async () => {
    const { auth, user } = await createAuthAndUser();
    const ticket = await auth.addEmailVerifyTicket(user.email);
    expect(ticket.length).toEqual(21);
  });

  it('should verify an email', async () => {
    const { auth, user } = await createAuthAndUser();
    const ticket = await auth.addEmailVerifyTicket(user.email);
    const verifiedUser = await auth.verifyEmail(user.email, ticket);
    expect(verifiedUser.emailVerified).toStrictEqual(true);
  });

  it('should not verify an email if ticket is expired', async () => {
    const { auth, user } = await createAuthAndUser();
    const ticket = await auth.addEmailVerifyTicket(user.email);
    await sleep(200);
    
    let errorMessage: string | undefined;
    try {
      await auth.verifyEmail(user.email, ticket);
    } catch(error) {
      errorMessage = error.message;
    }
    expect(errorMessage?.includes('expired')).toStrictEqual(true);
  });

  it('should add a mobile number and create a verify ticket', async () => {
    const { auth, user } = await createAuthAndUser();
    const mobileNumber = '12223334444';
    const ticket = await auth.addMobile(user.email, mobileNumber);
    expect(ticket?.length).toEqual(6);
    const updatedUser = await auth.getUser(user.id);
    expect(updatedUser?.mobile).toEqual(mobileNumber);
  });

  it('should verify a mobile number', async () => {
    const { auth, user } = await createAuthAndUser();
    const mobileNumber = '12223334444';
    const ticket = await auth.addMobile(user.email, mobileNumber);

    const verifiedUser = await auth.verifyMobile(user.email, ticket || '', mobileNumber);
    expect(verifiedUser.mobileVerified).toStrictEqual(true);
  });

  it('should not verify a mobile number if ticket is expired', async () => {
    const { auth, user } = await createAuthAndUser();
    const mobileNumber = '12223334444';
    const ticket = await auth.addMobile(user.email, mobileNumber);
    await sleep(200);

    let errorMessage: string | undefined;
    try {
      await auth.verifyMobile(user.email, ticket || '', mobileNumber)
    } catch(error) {
      errorMessage = error.message;
    }
    expect(errorMessage?.includes('expired')).toStrictEqual(true);
  });

  it('should create a JWT', async () => {
    const { auth, user } = await createAuthAndUser();
    const jwt = auth.createJwt(user);
    expect(jwt.length).toBeGreaterThan(20);
  });

  it('should create a JWT with email and password', async () => {
    const { auth, user } = await createAuthAndUser();
    const jwt = await auth.createJwtWithEmailPassword(testEmail, testPassword);
    expect(jwt?.length).toBeGreaterThan(20);
  });

  it('should verify a JWT', async () => {
    const { auth, user } = await createAuthAndUser();
    const jwt = auth.createJwt(user);
    const fetchedUser = await auth.getUserWithJwt(jwt);
    expect(fetchedUser?.id).toEqual(user.id);
  });
});