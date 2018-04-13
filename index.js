import pb from './pants_brain';

pb()
.then(function (value) {
  console.log(value)
}, function (error) {
  console.log(error)
})