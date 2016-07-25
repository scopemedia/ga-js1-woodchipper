/**
 * Project 3: SPA
 * ====
 *
 * See the README.md for instructions
 */

(function() {

// Variables

  var container = document.querySelector('#gif')
      loader = document.querySelector('#container')
      stopgif = false
      imageContainer = document.querySelector('.image-container')

      state = { loading: true }
  renderLoading(state, loader)


// Function takes in json and returns

  function loadRSS(url, dataProcessor) {

    fetch('https://crossorigin.me/http://mashable.com/stories.json').then((response) => {
      return response.json()
    }).then((dataAsJson) => {
      // Render Article Template
      var state = { loading: false }
      renderLoading(state, loader)
      var processedData = dataProcessor(dataAsJson)

      var timeoutID = []

      function gifLoop(gifArray) {
        if (stopgif) {
          return
        }
        for (var i = 0; i < gifArray.length; i++) {
          gifArray[i]
          var timeoutID = setTimeout(function(x) {
            return function() {
              var theTitle = processedData[x].articleTitle
              var theDescription = processedData[x].articleDescription
              renderTitle(theTitle, theDescription, container);
              var keywords = theTitle.split(' ',3).join("-")
              var gifLink = 'https://crossorigin.me/http://api.giphy.com/v1/gifs/search?q=' + keywords + '&api_key=dc6zaTOxFJmzC'
              loadGif(gifLink);
            };
          }(i), 10000*i);
          console.log('ID - ' + timeoutID);

        }

        // clearId(timeoutID);


      }

      // Loop through the returned array and return a
      gifLoop(processedData);

    }).catch(function(err) {
      console.log('Error', err);
      alert('Error fetching the RSS feed. Please try again.')
    });
  }

  function loadGif(url, single) {

    fetch(url).then((response) => {
      return response.json()
    }).then((dataAsJson) => {
      var state = { loading: false }
      renderLoading(state, loader)

      if (single) {
        var gifImage = dataAsJson.data.image_url
      } else {
        var gifImage = dataAsJson.data[0].images.downsized_large.url
      }

      imageContainer.style.backgroundImage = 'url("https://crossorigin.me/' + gifImage + '")';

    }).catch(function(err) {
      console.log('Error', err);
      alert('Error fetching the Giphy. Please try again.')
    });

  }


//  Function takes in Mashable json and returns an object with values

function mashableDataProcessor(dataAsJson) {
  var articleData =  dataAsJson.hot.map((item) => {
    return {
      articleTitle: item.title,
      articleDescription: item.excerpt,
    }
  })
  return articleData
}



// Listen for key presses

window.addEventListener('keydown', keyboardCode, false);

var keys = []

function keyboardCode(e) {
  // Store each key press in the keys array
  keys[e.keyCode] = true;

  // If up down left right keys are pressed then load take over mode
  if (keys[37] && keys[38] && keys[39] && keys[40]) {
    removeListner();
    loadForm();
    keywordForm();
  }
}

// Remove listner
function removeListner() {
  window.removeEventListener('keydown', keyboardCode, false);
  // Empty array
  keys.length = 0;
}

// Take Over View

// Load form into .take-over container
function loadForm() {
  document.querySelector('.take-over').innerHTML = `
  <div class="take-over-form">
    <h1>&#128165; TAKE OVER &#128165;</h1>
    <form class="to-form">
      <label for="keyword">Add Keyword</label>
      <input id="keyword" name="keyword" />
      <button id="keyword-button">+ Add</button>
    </form>
    <h2>KEYWORDS</h2>
    <div class="keywords-container"></div>
    <button id="keyword-view">Get GIPHY</button>

    <a href="#0" id="chipper-view">Return to Woodchipper</a>

  </div>
  `
}

// Create function to render Section around articles
//  - Function takes 2 parameters
//    1 - The Processed Data from the feed (Which contains an object with the key value pairs)
//    2 - The location to render into

function renderTitle(title, description, into) {

  into.innerHTML = `
    <h1>${title}</h1>
    <p>${description}</p>

  `
}

function chipperView() {
  document.querySelector('#chipper-view').addEventListener('click', (e) => {
    e.preventDefault();
    var state = { loading: true }
    renderLoading(state, loader)
    document.querySelector('.take-over').innerHTML = `  `
    loadRSS('https://crossorigin.me/http://mashable.com/stories.json', mashableDataProcessor)
    window.addEventListener('keydown', keyboardCode, false);
  });
}

// Click add-button button to add values
function keywordForm() {
  document.querySelector('#keyword-button').addEventListener('click', (e) => {
    e.preventDefault();
    var keyword = document.querySelector('#keyword').value

    // If no title or description, return early from this function
    if (!keyword) {
      return;
    }

    // Add values to firebase database
    firebase.database().ref('takeover/').push({
      keyword: keyword
    });

    // Remove value from input after adding it
    document.querySelector('#keyword').value = '';

  });


  // Show the full database value

  let listContainer = document.querySelector('.keywords-container');
  let state = {};

  firebase.database().ref('takeover/').on('value', function(snapshot) {
    // Pull the list value from firebase
    state.list = snapshot.val();
    renderList(listContainer, state)
    keywordList(state)
    chipperView()
  });


};

function renderList(into, state) {
  // Iterate over each element in the object
  into.innerHTML = Object.keys(state.list).map((key) => {
    return `
      <li data-id="${key}">
        ${state.list[key].keyword}
        <button class="delete">x</button>
      </li>
    `;
  }).join('');
  // Clicking to delete an item
  delegate('.keywords-container', 'click', '.delete', (event) => {
    let key = getKeyFromClosestElement(event.delegateTarget);
    // Remove that particular key
    firebase.database().ref(`takeover/${key}/`).remove();
  });

}

// get keywords array when chop button is pressed

function keywordList(state) {
  // Iterate over each element in the object
  var keyLoop = Object.keys(state.list).map((key) => {
    return state.list[key].keyword;
  }).join('-');

  document.querySelector('#keyword-view').addEventListener('click', () => {

    var gifLink = 'https://crossorigin.me/http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=' + keyLoop
    loadGif(gifLink, true);

    // Empty the Takeover state
    document.querySelector('.take-over').innerHTML = `  `
    // Empty the Healines
    container.innerHTML = `
      <h1>👉 ${keyLoop}</h1>
     `
    // Reenable the keyboard lister
    window.addEventListener('keydown', keyboardCode, false);

  });

}




// We added the `data-id` attribute when we rendered the items
 function getKeyFromClosestElement(element) {

   // Search for the closest parent that has an attribute `data-id`
   let closestItemWithId = closest(event.delegateTarget, '[data-id]')

   if (!closestItemWithId) {
     throw new Error('Unable to find element with expected data key');
   }

   // Extract and return that attribute
   return closestItemWithId.getAttribute('data-id');
 }

 // Loader State

 function renderLoading(data, into) {
   if (data.loading === true) {
     into.innerHTML = `
       <div id="pop-up" class="loader">
       </div>
     `
   } else {
     into.innerHTML = `

     `
   }
 }

// Clear timeout

function clearId(timeoutID) {
  for (var i = 0 ; i < timeoutID ; i++) clearTimeout(i);
  console.log('Done' + timeoutID);
}


// Kick off the loading of RSS feed

loadRSS('https://crossorigin.me/http://mashable.com/stories.json', mashableDataProcessor)


})()
