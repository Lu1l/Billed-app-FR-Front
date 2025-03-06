import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    this.localStorage = localStorage
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    this.formIsValid = false
    new Logout({ document, localStorage, onNavigate })
  }

  isFileValid = (file) => {
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg']
    return validTypes.includes(file.type)
  }

  handleChangeFile = e => {
    e.preventDefault()
    const fileInput = this.document.querySelector(`input[data-testid="file"]`)
    const file = fileInput.files[0]
    const filePath = e.target.value.split(/\\/g)
    const fileName = filePath[filePath.length-1]
    const errorMessage = this.document.querySelector(`div[data-testid="error-file"]`) || document.getElementById('MessageFile')
    
    // Validation du type de fichier
    if (file && this.isFileValid(file)) {
      if (!errorMessage.classList.contains('message-ok')) {
        errorMessage.classList.add('message-ok')
      }
      errorMessage.textContent = "Format de fichier valide"
      
      // Création et envoi du FormData
      const formData = new FormData()
      const email = JSON.parse(this.localStorage.getItem("user")).email
      formData.append('file', file)
      //formData.append('email', email)
      
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true
          }
        })
        .then((bill) => {
          this.billId = bill.key
          this.fileUrl = bill.filePath
          this.fileName = fileName
          this.formIsValid = true
        })
    } else {
      errorMessage.classList.remove('message-ok')
      errorMessage.textContent = "Format de fichier invalide (seuls .jpg, .jpeg et .png sont acceptés)"
      fileInput.value = "" // Réinitialiser l'input pour permettre à l'utilisateur de réessayer
      this.formIsValid = false
    }
  }

  validateForm = (formData) => {
    // Vérifier que tous les champs obligatoires sont remplis
    const requiredFields = ['type', 'name', 'date', 'amount', 'vat', 'pct']
    let isValid = true
    
    for (const field of requiredFields) {
      if (!formData[field] || formData[field] === '') {
        isValid = false
        break
      }
    }
    
    // Vérifier que le fichier a été correctement uploadé
    if (!this.fileUrl || !this.fileName) {
      isValid = false
    }
    
    return isValid
  }

  handleSubmit = e => {
    e.preventDefault()
    const email = JSON.parse(this.localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    
    // Validation du formulaire avant soumission
    if (this.validateForm(bill)) {
      this.updateBill(bill)
    } else {
      // Afficher un message d'erreur si le formulaire est invalide
      const errorDiv = document.createElement('div')
      errorDiv.classList.add('error-message')
      errorDiv.textContent = "Veuillez remplir tous les champs obligatoires et télécharger une image valide"
      const form = e.target
      
      // Supprimer les messages d'erreur précédents
      const previousError = form.querySelector('.error-message')
      if (previousError) {
        form.removeChild(previousError)
      }
      
      form.insertBefore(errorDiv, form.firstChild)
    }
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => {
          console.error(error)
          // Afficher un message d'erreur à l'utilisateur
          const errorDiv = document.createElement('div')
          errorDiv.classList.add('error-message')
          errorDiv.textContent = "Une erreur est survenue lors de la mise à jour de la note de frais"
          const form = this.document.querySelector(`form[data-testid="form-new-bill"]`)
          form.insertBefore(errorDiv, form.firstChild)
        })
    }
  }
}