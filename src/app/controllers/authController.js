const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mailer = require("../../modules/mailer");

const authConfig = require("../../config/auth.json");

const User = require("../models/user");

const router = express.Router();

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
}

/** Rota de listagem de usuários */
router.get("/", async (req, res) => {
  try {
    const user = await User.find();

    return res.send({ user });
  } catch (err) {
    return res.status(400).send({ error: "Error list user" });
  }
});

/** Rota de listagem por id do usuário */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    console.log(user);

    return res.send({ user });
  } catch (err) {
    return res.status(400).send({ error: "Error list user" });
  }
});

/** Rota de Cadastro */
router.post("/register", async (req, res) => {
  try {
    const { email } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).send({ error: "User already exists" });

    const user = await User.create(req.body);

    user.password = undefined;

    return res.send({ user, token: generateToken({ id: user.id }) });
  } catch (err) {
    return res.status(400).send({ error: "Registration failed" });
  }
});

/** Rota de autenticação */
router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) return res.status(400).send({ error: "User not found" });

  if (!(await bcrypt.compare(password, user.password)))
    return res.status(400).send({ error: "Invalid password" });

  user.password = undefined;

  res.send({ user, token: generateToken({ id: user.id }) });
});

/** Esqueci minha senha */
router.post("/forgot_password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).send({ error: "User not found" });

    const token = crypto.randomBytes(3).toString("hex");

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user.id, {
      $set: {
        passwordResetToken: token,
        passwordResetExpires: now,
      },
    });

    mailer.sendMail(
      {
        to: email,
        from: "andrieleaschi@gmail.com",
        subject: "Recuperação de senha",
        template: "auth/forgot_password",
        context: { token },
      },
      (err) => {
        if (err)
          return res
            .status(400)
            .send({ error: `Cannot send forgot password email ${err}` });

        return res.send();
      }
    );
  } catch (err) {
    res.status(400).send({ error: "Erro on forgot password, try again" });
  }
});

/** Resetar a senha */
router.post("/reset_password", async (req, res) => {
  const { email, token, password } = req.body;

  try {
    const user = await User.findOne({ email }).select(
      "+passwordResetToken passwordResetExpires"
    );

    if (!user) return res.status(400).send({ error: "User not found" });

    if (token !== user.passwordResetToken)
      return res.status(400).send({ error: "Token invalid" });

    const now = new Date();

    if (now > user.passwordResetExpires)
      return res
        .status(400)
        .send({ error: "Token expired, generate a new one" });

    user.password = password;

    await user.save();

    res.send();
  } catch (err) {
    res.status(400).send({ error: "Cannot reset password, try again" });
  }
});

/** Atualiza dados do usuário */
router.put("/:id", async (req, res) => {
  try {
    const { name, crm, description, contact } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, crm, contact, description },
      { new: true }
    );

    return res.send({ user });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: "Error edit user." });
  }
});

/** Muda o status do usuário para listar no chat pvt */
router.put("/chat/:id", async (req, res) => {
  try {
    const { statusChat } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { statusChat },
      { new: true }
    );

    return res.send({ user });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: "Error edit user." });
  }
});

/** Excluir usuário do sistema */
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndRemove(req.params.id);

    return res.send();
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: "Error delete user" });
  }
});

module.exports = (app) => app.use("/user", router);
