const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const admin = require("firebase-admin");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, "serviceAccountKey.json");

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function initializeFirebase() {
  if (admin.apps.length) {
    return admin.firestore();
  }

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.warn(
      `Arquivo de credenciais não encontrado: ${SERVICE_ACCOUNT_PATH}. `
      + "Copie serviceAccountKey.example.json para serviceAccountKey.json e preencha com a chave do Firebase."
    );
    return null;
  }

  // Inicialização solicitada com o SDK firebase-admin.
  const serviceAccount = require(path.resolve(SERVICE_ACCOUNT_PATH));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin.firestore();
}

const db = initializeFirebase();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createPasswordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, "sha512").toString("hex");
  return { salt, hash };
}

function isPasswordValid(password, user) {
  const { hash } = createPasswordHash(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passwordHash, "hex"));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function requireDatabase(response) {
  if (db) return false;

  sendJson(response, 503, {
    message: "Banco de dados não configurado. Configure o arquivo serviceAccountKey.json do Firebase.",
  });
  return true;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Payload muito grande."));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

async function handleCadastro(request, response) {
  if (requireDatabase(response)) return;

  try {
    const body = await readRequestBody(request);
    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "").trim();

    if (!name || !email || !password) {
      sendJson(response, 400, { message: "Preencha todos os campos para criar sua conta." });
      return;
    }

    const userRef = db.collection("usuarios").doc(email);
    const existingUser = await userRef.get();

    if (existingUser.exists) {
      sendJson(response, 409, { message: "Este email já está cadastrado." });
      return;
    }

    const passwordData = createPasswordHash(password);

    await userRef.set({
      name,
      email,
      passwordHash: passwordData.hash,
      salt: passwordData.salt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    sendJson(response, 201, { message: "Conta criada com sucesso!", user: { name, email } });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    sendJson(response, 500, { message: "Erro ao cadastrar usuário." });
  }
}

async function handleLogin(request, response) {
  if (requireDatabase(response)) return;

  try {
    const body = await readRequestBody(request);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "").trim();

    if (!email || !password) {
      sendJson(response, 400, { message: "Email ou senha inválidos" });
      return;
    }

    const userSnapshot = await db.collection("usuarios").doc(email).get();

    if (!userSnapshot.exists) {
      sendJson(response, 401, { message: "Email ou senha inválidos" });
      return;
    }

    const user = userSnapshot.data();

    if (!isPasswordValid(password, user)) {
      sendJson(response, 401, { message: "Email ou senha inválidos" });
      return;
    }

    sendJson(response, 200, { message: "Login realizado com sucesso!", user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    sendJson(response, 500, { message: "Erro ao fazer login." });
  }
}

function serveStaticFile(request, response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Acesso negado");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Arquivo não encontrado");
      return;
    }

    const contentType = CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && pathname === "/api/cadastro") {
    handleCadastro(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/login") {
    handleLogin(request, response);
    return;
  }

  if (request.method === "GET") {
    serveStaticFile(request, response, pathname);
    return;
  }

  sendJson(response, 405, { message: "Método não permitido." });
});

server.listen(PORT, () => {
  console.log(`Servidor Guardiões do Cerrado rodando em http://localhost:${PORT}`);
});
