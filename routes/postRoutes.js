const express = require("express");
const Post = require("../models/Post");

const router = express.Router();

// Crear un nuevo post
router.post("/", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ error: "Error al crear el post: ", err });
  }
});

// Obtener posts con paginación
router.get("/", async (req, res) => {
  const { page = 1, limit = 10, sort = "recent" } = req.query; // Extraer parámetros
  const skip = (page - 1) * limit; // Calcular desplazamiento

  try {
    let sortQuery;

    // Determinar el criterio de ordenamiento
    switch (sort) {
      case "recent": // Más recientes
        sortQuery = { createdAt: -1 };
        break;
      case "oldest": // Más antiguos
        sortQuery = { createdAt: 1 };
        break;
      case "popular": // Más populares
        sortQuery = { likes: -1 };
        break;
      case "random": // Aleatorio
        const totalPosts = await Post.countDocuments(); // Contar total de posts
        const randomSkip = Math.floor(Math.random() * totalPosts); // Generar desplazamiento aleatorio
        const randomPosts = await Post.find()
          .skip(randomSkip)
          .limit(parseInt(limit)); // Limitar el número de resultados aleatorios
        return res.status(200).json({
          currentPage: parseInt(page),
          posts: randomPosts,
          totalPosts: randomPosts.length, // Al ser aleatorio, solo se retornan los resultados limitados
        });
      default: // Por defecto, más recientes
        sortQuery = { createdAt: -1 };
    }

    // Consultar con paginación y ordenamiento
    const posts = await Post.find()
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortQuery);

    // Contar total de posts
    const totalPosts = await Post.countDocuments();

    res.status(200).json({
      totalPosts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / limit),
      posts,
    });
  } catch (err) {
    console.error("Error al obtener los posts:", err);
    res.status(500).json({ error: "Error al obtener los posts" });
  }
});

// Actualizar likes
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar likes" });
  }
});

// Eliminar un post
router.delete("/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar el post" });
  }
});

module.exports = router;
