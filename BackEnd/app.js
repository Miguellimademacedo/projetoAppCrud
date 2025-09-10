// EXPRESS --> Framework para criar servidores e API de forma rápida!
//EXPRESS --> Facilita na criação de rotas, a lidar com requisições e respostas

const express = require("express");

// CORS --> Permite que nosso back-end aceite requisições vinda de outras origens ( React Native, React)
// CORS --> Sem o cors, os navegadores bloqueiam essas conexões.
const cors = require("cors");

// DOTENV --> Gerencia as variáveis de ambiente em um arquivo .env
// DOTENV --> Desta maneira não deixamos senhas, tokens e configs expostas no código!
const dotenv = require("dotenv");

// MYSQL2 --> Biblioteca para conectarmos o Node ao banco MYSQL2
// MYSQL --> Essa versão suporta Promises, permitindo usar async/await em consultas.
const mysql = require("mysql2/promise");

// BCRYPT --> Usado para criptografar as senhas.
// BCRYPT --> Nunca devemos salvar as senhas pura no banco, por isso usamos o bcrypt
const bcrypt = require("bcrypt");

// JSONWEBTOKEN --> Gerar tokens de validação.
// JSONWEBTOKEN --> Quando o usuário loga, enviamos um JWT ao usuário, que será usado para acessar rotas protegidas.
const jwt = require("jsonwebtoken");

const PORT = 3001;
const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

// Conexão com o banco MYSQLconst pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

// Middleware
function autenticarToken(req, res, next) { // Corrigi o parâmetro "text" para "next"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Corrigi o split, estava faltando o espaço

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido!" })
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({ error: "Token inválido!" })
    }

    req.user = user;
    next();
  })
}

// Rota: REGISTRO
app.post("/auth/register", async (req, res) => {

  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: "Preencha todos os campos!" });
    }

    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email])
    if (rows.length > 0) {
      return res.status(400).json({ error: "Email já cadastrado!" })
    }

    const senha_hash = await bcrypt.hash(senha, 10)

    await pool.query("INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, senha_hash]
    );

    res.status(201).json({ message: "Usuário criado com sucesso!" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

// Rota: LOGIN
app.post("/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log(email, senha)

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email])
    if (rows.length === 0) { // Corrigi "lenght" para "length"
      return res.status(400).json({ error: "Usuário não encontrado!" }) // Corrigi a mensagem de erro
    }

    const usuario = rows[0];

    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    res.json({ message: "Login bem sucedido!", token })

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao fazer login!" })
  }
})

// Rota: PERFIL
app.get("/auth/profile", autenticarToken, async (req, res) => {

  try {
    const [rows] = await pool.query("SELECT nome, email FROM users WHERE email = ?", [req.user.email]) // Corrigi de req.user.id para req.user.email

    if (rows.length === 0) { // Corrigi "lenght" para "length"
      return res.status(404).json({ error: "Usuário não encontrado." }) // Corrigi a mensagem de erro
    }

    res.json({ user: rows[0] })

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Erro ao buscar dados do usuário!" })
  }

})

// Rota: ATUALIZAR
app.put("/auth/update", autenticarToken, async (req, res) => {

  try {
    const { nome, email } = req.body;
    if (!nome && !email) {
      return res.status(400).json({ error: "Informe nome ou email para atualizar" })
    }

    await pool.query(
      "UPDATE users SET nome = ?, email = ? WHERE id = ?", [nome, email, req.user.id] // Corrigi a query para passar req.user.id corretamente
    )

    res.json({ message: "Dados atualizados com sucesso!" })

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar usuário!" })
  }

})

// Rota: DELETE
app.delete("/auth/delete", autenticarToken, async (req, res) => {

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]) // Corrigi de req.user.id para req.user.email

    if (rows.length === 0) { // Corrigi "lenght" para "length"
      return res.status(404).json({ error: "Usuário não encontrado." }) // Corrigi a mensagem de erro
    }

    console.log(req.user.id)
    await pool.query(
      "DELETE FROM users WHERE id = ?", [req.user.id] // Corrigi a query para passar req.user.id corretamente
    )

    res.json({ message: "Dados removidos com sucesso!" })

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar usuário!" })
  }

})

async function conexaoBd() {
  try {
    const conn = await pool.getConnection();
    console.log("Conexão com MYSQL bem sucedida!")
    conn.release(); // Corrigi o "relese" para "release"
  } catch (error) {
    console.log(`Error: ${error}`)
  }
}


async function conexaoBd() {
  try {
    const conn = await pool.getConnection();
    console.log("Conexão com MYSQL bem sucedida!")
    conn.release(); // Corrigi o "relese" para "release"
  } catch (error) {
    console.log(`Error: ${error}`)
  }
}

// Iniciando servidor!
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}!`)
});
