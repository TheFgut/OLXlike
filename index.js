const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const exphbs = require('express-handlebars')
const appDefRouter = require('./routes/productsShowRouter')
const authRouter = require('./routes/authRouter')
const PORT = process.env.PORT || 3000

const uri = "mongodb+srv://Fgut:XwOEVelAPMFfEc1H@defaultclaster.2jndzbl.mongodb.net/avitoLike";

const app = express()
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs'
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')))

app.use(appDefRouter)
app.use("/auth", authRouter)

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);

async function start() {
  try {
      await mongoose.connect(uri);

    app.listen(PORT, () => {
      console.log('Server has been started...')
    })
  } catch (e) {
    console.log(e)
  }
}

start();