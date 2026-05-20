
import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Home from './components/Pages/Home.jsx'
import PlayList from './components/Pages/PlayList.jsx'
import Profile from "./components/Pages/Profile.jsx"
import AuthPage from './components/Pages/AuthPage.jsx'
import SearchPage from './components/Pages/SearchPage.jsx'
import PlaylistSongsPage from './components/Pages/PlaylistSongsPage.jsx'
import LikedSongsPage from './components/Pages/LikedSongsPage.jsx'
import NotFoundPage from './components/NotFoundPage.jsx'
export default function App() {
  let router=createBrowserRouter([{
    path:"/",
    element:<Home/>
  },
{path:"/playlist",
  element:<PlayList/>
},
{path:"/profile",
  element:<Profile/>
},

{path:"/authpage",
  element:<AuthPage/>
}
,{path:"/search",
  element:<SearchPage/>
},{
  path: '/playlist/:id',
  element: <PlaylistSongsPage />,
},{
  path: '/liked-songs',
  element: <LikedSongsPage/>,
}
,{
  path: '/*',
  element: <NotFoundPage/>,
}
])
  return (
   <>
   <RouterProvider router={router}/>
   
   
   </>
  )
}
