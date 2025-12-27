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
        // console.log(req.url)
    })

router.route("/team")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "team.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading team.html")
            }
        })
        // console.log(req.url)
    })

router.route("/contact")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "contact.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading contact.html")
            }
        })
        // console.log(req.url)
    })

router.route("/support")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "support.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading support.html")
            }
        })
        // console.log(req.url)
    })

router.route("/policy")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "policy.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading policy.html")
            }
        })
        // console.log(req.url)
    })

router.route("/terms")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "terms.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading terms.html")
            }
        })
        // console.log(req.url)
    })

router.route("/cookies")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "cookies.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading cookies.html")
            }
        })
        // console.log(req.url)
    })

router.route("/licenses")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "licenses.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading licenses.html")
            }
        })
        // console.log(req.url)
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