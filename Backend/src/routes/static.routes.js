import express, { Router } from "express"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const staticPath = path.join(__dirname, "../../../Frontend/public")
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


router.route("/signup")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "signup.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading signup.html")
            }
        })
        // console.log(req.url)

    })

router.route("/login")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "login.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading login.html")
            }
        })
        // console.log(req.url)
    })


router.route("/about")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "about.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading about.html")
            }
        })
        // console.log(req.url)
    })



// router.route("/articles/:slug")
//     .get((req, res) => {
//         res.sendFile(path.join(staticPath, "article.html"), (err) => {
//             if (err) {
//                 res.status(500).send("Error loading article.html")
//             }
//         })
//         // console.log(req.url)
//     })

router.route("/discover")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "discover.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading discover.html")
            }
        })
        // console.log(req.url)
    })

router.route("/album")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "album.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading album.html")
            }
        })
        // console.log(req.url)
    })

router.route("/artist")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "artist.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading artist.html")
            }
        })
        // console.log(req.url)
    })

router.route("/profile")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "profile.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading profile.html")
            }
        })
        // console.log(req.url)
    })
router.route("/setting")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "setting.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading setting.html")
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
router.route("/help")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "help&FAQ_page.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading help&FAQ_page.html")
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
router.route("/cookie-policy")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "cookie-policy.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading cookie-policy.html")
            }
        })
        // console.log(req.url)
    })

router.route("/review")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "review.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading review.html")
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