let toggleBtn = document.getElementById("toggleBtn");
toggleBtn.addEventListener("click", (e) => {
  let element = e.target.parentElement;
  if (element.className == 'active') {
    element.classList.remove('active');
  }
  else {
    element.classList.add('active');
  }
});
console.log("hello");

function handleDelete(e) {
  let csrf = e.target.parentNode.querySelector("[name='_csrf']").value;
  let prodId = e.target.parentNode.querySelector("[name='id']").value;

  let productElement = e.target.closest('article');
  fetch('/admin/delete/' + prodId, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf
    }
  })
    .then(result => {
      return result.json();
    })
    .then(data => {
      productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
      console.log(err);
    });
}

let deleteProductBtn = document.querySelectorAll(".delete-product-btn");
Array.from(deleteProductBtn).forEach((e) => {
  e.addEventListener('click', handleDelete)
})