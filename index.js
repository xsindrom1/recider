const express = require("express");
const cors = require("cors");
const app = express();

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const port = process.env.PORT || 3000; // Use the port you prefer

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    return res.status(200).send("Welcome to Recido");
  });
  
  // Post
  // Post method
  app.post("/api/create", (req, res) => {
    (async () => {
      try {
        const ingredientArray = req.body.ingredient
            .split(",").map((ingredient) => ingredient.trim());
        const stepArray = req.body.step.split(";").map((step) => step.trim());
  
        await db.collection("recidoRecipe").doc(`/${Date.now()}/`).create({
          id: Date.now(),
          recipe: req.body.recipe,
          recipeLower: req.body.recipe.toLowerCase(),
          image: req.body.image,
          ingredient: ingredientArray,
          step: stepArray,
        });
  
        return res.status(200).send({status: "Success", msg: "Data Saved"});
      } catch (error) {
        console.log(error);
        res.status(500).send({status: "Failed", msg: error});
      }
    })();
  });
  
  
  app.post("/api/createMultiple", async (req, res) => {
    try {
      const recipes = req.body.recipes;
  
      for (const recipe of recipes) {
        const keywords = recipe.recipe.toLowerCase().split(" ");
        const ingredientArray = recipe.ingredient
            .split(",").map((ingredient) => ingredient.trim());
        const stepArray = recipe.step.split(";").map((step) => step.trim());
  
        await db.collection("recidoRecipe").doc(`/${Date.now()}/`).create({
          id: Date.now(),
          recipe: recipe.recipe,
          recipeLower: recipe.recipe.toLowerCase(),
          keywords: keywords,
          image: recipe.image,
          ingredient: ingredientArray,
          step: stepArray,
        });
      }
  
      return res.status(200).send({status: "Success", msg: "Recipes Saved"});
    } catch (error) {
      console.log("Error in createMultiple route:", error);
      res.status(500).send({status: "Failed", msg: error});
    }
  });
  
  
  // Read all recipes
  app.get("/api/allRecipes", async (req, res) => {
    try {
      const recipesRef = db.collection("recidoRecipe");
      const querySnapshot = await recipesRef.get();
  
      const allRecipes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        recipe: doc.data().recipe,
        image: doc.data().image,
      }));
  
      return res.status(200).json({
        status: "Success",
        data: allRecipes,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "Failed",
        msg: error.message,
      });
    }
  });
  
  // Search recipe by lowercased recipe name
  app.get("/api/searchRecipe/:recipeLower", async (req, res) => {
    try {
      const searchTerms = req.params.recipeLower.split(" ");
  
      const query = db.collection("recidoRecipe");
  
      searchTerms.forEach((term) => {
        query.where("keywords", "array-contains", term.toLowerCase());
      });
  
      const results = await query.get();
  
      const recipeData = results.docs.map((doc) => ({
        id: doc.id,
        recipe: doc.data().recipe,
        image: doc.data().image,
        // Add other fields as needed
      }));
  
      if (recipeData.length > 0) {
        return res.status(200).json({
          status: "Success",
          data: recipeData,
        });
      } else {
        return res.status(404).json({
          status: "Failed",
          msg: "No recipe details match the provided search terms.",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "Failed",
        msg: error.message,
      });
    }
  });
  
  // Read specific recipe by ID
  app.get("/api/recipe/:id", (req, res) => {
    (async () => {
      try {
        const reqDoc = db.collection("recidoRecipe").doc(req.params.id);
        const recidoRecipe = await reqDoc.get();
        const response = recidoRecipe.data();
  
        return res.status(200).send({status: "Success", data: response});
      } catch (error) {
        console.log(error);
        res.status(500).send({status: "Failed", msg: error});
      }
    })();
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  
