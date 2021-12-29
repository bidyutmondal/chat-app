const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('#message')
const $messageFormButton = document.querySelector('#send-button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $linkTemplate = document.querySelector('#location-message').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = ()=>{
    //new message element
    const $newMessage = $messages.lastElementChild

    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of message container
    const containerHeight = $messages.scrollHeight

    //how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    console.log(message);
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a'),
        message: message.text
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', (url)=>{
    console.log(url);
    const html = Mustache.render($linkTemplate, {
        username: url.username,
        createdAt: moment(url.createdAt).format('h:mm a'),
        url: url.text
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html    
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    //console.log('Clicked on send button');
    //const message = document.querySelector('#message')
    //same but better
    const message = e.target.elements.message.value
    socket.emit('sendMessage', {username, room, message}, (error)=>{

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error);
        }
        console.log('Message delivered');
    })
})

$sendLocationButton.addEventListener('click', ()=>{
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation){
        $sendLocationButton.removeAttribute('disabled')
        return console.log('Geolocation api is not supported on your browser');
    }
    navigator.geolocation.getCurrentPosition((position)=>{
        //console.log(position);
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error)=>{
            $sendLocationButton.removeAttribute('disabled')
            if(error){
                return console.log(error);
            }
            console.log('Location shared.');
        })
    })
})



socket.emit('join', {username, room}, (error)=>{
    if(error){
        return console.log(error);
    }
    console.log(`${username} has joined ${room} chat room.`);
})