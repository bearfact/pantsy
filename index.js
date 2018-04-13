import pb from './pants_brain';

const data = [
  { input: { h6: 0.16666666666666666,
    h8: 0.16666666666666666,
    h10: 0.16666666666666666,
    h12: 0.16666666666666666,
    h14: 0.31666666666666665,
    h16: 0.36666666666666664,
    h18: 0.35,
    s: 1,
    w: 0 },
 output: { pants: 1 } } 
]
pb.run('OK', 'Crowder', data)
.then(function (value) {
  console.log(value)
}, function (error) {
  console.log(error)
})