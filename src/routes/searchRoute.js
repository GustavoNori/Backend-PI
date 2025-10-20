const searchController = require("../controllers/searchController")

const express = require("express")
const router = express.Router()

router.get("/:category", searchController.findByFilters)

module.exports = router