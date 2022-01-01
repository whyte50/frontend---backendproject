import { createStore } from 'vuex'
import http from '../server/server.config.js'
import createPersistedState from "vuex-persistedstate";
import router from '../router/index'

import axios from 'axios';

export default createStore({
  state: {
    userDetails: null,
    amount : null,
    error : null,
    isLoggedIn : false,
    cardData : null,
    testData: null,
    modal: false,
    params: {
      acountNumber: null,
      code : null
    }
  },
  mutations: {
    register(state, user){
      state.userDetails = user
    },
    logout(state){
      state.userDetails = null;
      state.isLoggedIn = false
      state.error = null
      state.cardData = null
      state.amount = null,
      state.testData = null,
      state.params = null
    },
    addCard(state, card){
      state.cardData = card
    },
    loggedIn(state){
      state.isLoggedIn = true
    },
    newCard(state, card){
      state.testData = card
    },
    sucess(state){
      state.testData = null
    },
    clearError(state){
      state.error = null
    },
    getAmount(state, amount) {
      state.amount = amount
    },
    showModal(state){
      state.modal = true
    },
    closeModal(state){
      state.modal = false
    },
    addCode(state, payload) {
      state.params.code = payload
    },
    addAccNum(state, payload){
      state.params.acountNumber = payload
    }
  },
  actions: {
    registerUser : async ({commit, state}, user) => {
      commit('register', user);

        await http.post("/register", {
          username : state.userDetails.username,
          password : state.userDetails.password,
          email : state.userDetails.email
        })
        
        .then((response) => {

          state.userDetails.id = response.data._id
          state.userDetails = response.data.key
          commit('register', state.userDetails)
          commit('loggedIn')

          commit('sucess')
          router.push('/')
        })

        .catch((error) => {
          state.error = error.response.data.message
          const userr = null
          commit('register', userr)
        })

    },
    loginUser: async ({commit, state}, user) => {
      state.error = null
      commit('register', user);

        await http.post("/login", {
          email : state.userDetails.email,
          password : state.userDetails.password,
        })
        
        .then((response) => {

          state.userDetails.id = response.data.user._id
          state.userDetails.username = response.data.user.username
          state.userDetails.key = response.data.key

          sessionStorage.setItem('token', response.data.token)
          commit('loggedIn')
          commit('register', state.userDetails)

          commit('sucess')
          router.push('/')
        })

        .catch((error) =>{
          state.error = error.response.data.message
        })

    },
    logoutUser: async ({commit, state}) => {
      try{
        sessionStorage.removeItem('token')
        commit('logout')
        router.push('/login')
      }catch(err){
        console.log(err)
      }
    },
    addNewCard : async ({commit, state}, card) => {
      commit('newCard', card)
      await http({
        baseURL : 'https://backend--backendproject.herokuapp.com/',
        url : '/payapi/card',
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin" : "*",
        },
        method : 'POST',
        data: {
          cardNumber: state.testData.cardNumber,
          exp: state.testData.exp,
          id: state.userDetails.id
        }
      })
      .then((response) => {
        console.log(response)
        state.error = "Card Added. Refresh to see changes"
        commit('sucess')
      })

      .catch((error) => {
        commit('newCard', null)
        state.error = error.response.data.message
      })
    },
    verifyAccount : async ({commit, state}, accNum) => {

      commit('addAccNum', accNum);

      await axios({
        baseURL: 'https://api.paystack.co',
        port: 443,
        url: `/bank/resolve?account_number=${state.params.acountNumber}&bank_code=${state.params.code}`,
        method: 'GET',
        headers: {
          Authorization: 'Bearer sk_test_9b3f2dede7de67fcf534ed0f9b747517889153a9',
        }
      })

      .then(async (response) => {

        commit('newCard', response.data.data);

        await axios({
          method: 'POST',
          url: '/payapi/account/benefit',
          baseUrl: 'https://backend--backendproject.herokuapp.com/',
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            accountName: state.testData.account_name,
            accountNumber: state.testData.account_number,
            bankID: state.testData.bank_id,
            id: state.userDetails.id
          }
        })
        
        .then((response) => {
          console.log(response)
          state.error = "Beneficiary Added."
        })

      })
    }
  },
  modules: {
  },
  plugins: [createPersistedState()]
})
