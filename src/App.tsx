import { Navigate, Route, Routes } from 'react-router-dom'
import DishDetailPage from './pages/DishDetailPage'
import DishEditPage from './pages/DishEditPage'
import DishListPage from './pages/DishListPage'
import './styles/app.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DishListPage />} />
      <Route path="/dishes/new" element={<DishEditPage mode="create" />} />
      <Route path="/dishes/:id" element={<DishDetailPage />} />
      <Route path="/dishes/:id/edit" element={<DishEditPage mode="edit" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
