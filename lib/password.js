import bcrypt from "bcryptjs";

const ROUNDS = 12;

/** Hash precomputado para comparaciones constant-time cuando el usuario no existe. */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$IK02Z7S4BJIi/Bn2ukJcEeUvJPtoS3oviK00SBkRqzALnrQobGrr6";

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, ROUNDS);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash || DUMMY_PASSWORD_HASH);
}
