const warning = document.querySelector('#warning')
const author = document.querySelector("#authors")
const language = document.querySelector('#language')
const submit = document.querySelector('#submit')

author.addEventListener('change', (event) => {
  if (author.value === '') {
    warning.innerText = 'You must choose at least one author'
    submit.disabled = true
  } else {
    if (language.value.length !== 2) warning.innerText = 'You must type in a two letter langauge code (ISO 639-1)'
    if (language.value.length === 2 && author.value !== '') {
      submit.disabled = false
      warning.innerText = ''
    }
  }
})

language.addEventListener('input', () => {
  if (language.value.length !== 2) {
    warning.innerText = 'You must type in a two letter langauge code (ISO 639-1)'
    submit.disabled = true
  } else {
    if (author.value === '') warning.innerText = 'You must choose at least one author'
    if (language.value.length === 2 && author.value !== '') {
      submit.disabled = false
      warning.innerText = ''
    }
  }
})

