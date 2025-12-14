import express, { Router } from "express"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const staticPath = path.join(__dirname, "../../../Frontend/snippet.co_page/public")
router.use(express.static(staticPath))

router.use("assets", express.static(path.join(staticPath, "assets")))
router.use("/images", express.static(path.join(staticPath, "assets/images")))
router.use("/css", express.static(path.join(staticPath, "assets/css")))




router.route("/")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "index.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading index.html")
            }
        })
        console.log(req.url)
    })



router.use((req, res, next) => {
    res.status(404).sendFile(path.join(staticPath, "404.html"), (err) => {
        if (err) {
            res.status(500).send("Error loading 404.html");
        }
    });
    console.log(req.url)
});


export default router