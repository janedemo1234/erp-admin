import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16 text-center dark:bg-gray-900 sm:py-24">
      <p className="text-base font-semibold text-primary-600 dark:text-primary-400">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div className="mt-6">
        <Link to="/" className="btn-primary">
          Go back home
        </Link>
      </div>
    </div>
  )
}

export default NotFound