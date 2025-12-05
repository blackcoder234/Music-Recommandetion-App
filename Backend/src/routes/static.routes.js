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
    })


router.route("/register")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "register.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading register.html")
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
        res.sendFile(path.join(staticPath, "aboutPage.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading aboutPage.html")
            }
        })
        // console.log(req.url)
    })

router.route("/blog")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "blog_page.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading blog_page.html")
            }
        })
        // console.log(req.url)
    })

router.route("/articles/:slug")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "article.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading article.html")
            }
        })
        // console.log(req.url)
    })

router.route("/research")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "research_page.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading research_page.html")
            }
        })
        // console.log(req.url)
    })

router.route("/user-profile")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "user_profile_page.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading user_profile_page.html")
            }
        })
        // console.log(req.url)
    })

router.route("/edit-profile")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "user_profile_update.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading user_profile_update.html")
            }
        })
        // console.log(req.url)
    })

router.route("/forgot-password")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "forget.password.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading forget.password.html")
            }
        })
        // console.log(req.url)
    })
router.route("/gallery")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "gallery.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading gallery.html")
            }
        })
        // console.log(req.url)
    })

router.route("/contact")
    .get((req, res) => {
        res.sendFile(path.join(staticPath, "contact_us.html"), (err) => {
            if (err) {
                res.status(500).send("Error loading contact_us.html")
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