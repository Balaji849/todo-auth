import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Card from "../src/components/Todocard";
import Loader from "./components/Loader";
import logo from "./assets/logo.png"
import { SignedIn, SignedOut, SignInButton, UserButton,useUser,useAuth } from "@clerk/clerk-react";
import Intro from "./components/Intro";



const firebaseUrl ='https://front-end-cohort-default-rtdb.asia-southeast1.firebasedatabase.app/'

function App() {
  let {user}=useUser();
  let {isSignedIn}=useAuth();
  let taskinput=useRef(null)
  let[formStatus,setformStatus]=useState(false)
  let[todos,setTodos]=useState([])

  function handleSubmit(){
    setformStatus(true)
    let task=taskinput.current.value;
    axios.post(`${firebaseUrl}todos.json`,
      {
        title:task,
        createdBy:user.username,
      }
    ).then(()=>{
      setformStatus(false)
      fetchTodos();
    })
    
  }
  
  function handleDelete(id){
    axios.delete(`${firebaseUrl}todos/${id}.json`).then(()=>{
      fetchTodos();
    })
  }
  function fetchTodos(){
    axios.get(`${firebaseUrl}todos.json`).then(todos=>{
      let tempTodos=[];
      for (let key in todos.data){
        let todo={
          id:key,
          ...todos.data[key]
        }
        tempTodos.push(todo)
      }
      setTodos(tempTodos)
    })
  }

  
  useEffect(()=>{
    fetchTodos()
  },[])

  return (
    <>
    <div className=" border-b py-3 ">
    <div className="max-w-4xl mx-auto flex justify-between items-center">
      <img className="h-8" src={logo} alt="" />
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
    </div>
    </div>

    <SignedIn>
      <div  className="w-[500px] mx-auto mt-12">
      <h1 className="text-2xl font-bold">Manage your Taks!<span className="text-neutral-500">{isSignedIn ?user.fullName:""}</span></h1>
      <p>Empowering productivity with seamless task management</p>
      <input ref={taskinput}  className="mt-2 border rounded-xl p-3 w-[300px]  focus:outline-none border-neutral-300" type="text" placeholder="Add Tasks i.e Learn Blockchain" />

      <button onClick={handleSubmit} className="mt-2 rounded-xl py-3 px-5 bg-black text-white flex align-center gap-4">
        {!formStatus ? "Create Task" : <Loader/>}
      </button>

      <div className="mt-12">
     {todos.filter(todo=>isSignedIn? todo.createdBy==user.username :true).map(todo=> <Card title={todo.title} handleDelete={handleDelete} id={todo.id} key={todo.id} />) }
      </div>

      </div>
      </SignedIn>
      
      <SignedOut>
        <Intro/>
      </SignedOut>

      
    </>
  )
}

export default App
