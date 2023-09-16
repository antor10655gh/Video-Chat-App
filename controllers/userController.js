module.exports.getIndex = async (req, res) => {
    try {
        res.render('index')
    } catch (error) {
        console.log(error)
    }
}