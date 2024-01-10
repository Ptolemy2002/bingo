import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { useCurrentPath, routes } from 'src/lib/Browser';
import NotFoundPage from 'src/pages/NotFoundPage';
import { combineClassNames } from 'src/lib/Misc';
import { useCookies } from 'react-cookie';
import { BingoGameDataProvider } from 'src/lib/BingoUtil';
import GameDisplay from 'src/components/GameDisplay';

export default function App() {
    const [cookies] = useCookies(["currentGame"]);

    const routeElements = routes.map((route) => {
        return (
            <Route key={route.path} path={route.path} element={route.element} />
        );
    });

    const routerElement = (
        <Router>
            <Header title="Bingo App" />
            <main className="flex-grow-1">
                <Routes>
                    {routeElements}
                    <Route key="404" path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
            <Footer />
        </Router>
    );

    if (cookies.currentGame) {
        return (
            <BingoGameDataProvider
                value={cookies.currentGame}
                primaryKey="id"
            >
                {routerElement}
            </BingoGameDataProvider>
        );
    } else {
        return (
            <BingoGameDataProvider
                data={null}
            >
                {routerElement}
            </BingoGameDataProvider>
        );
    }
}

function Header({
    title
}={}) {
    const currentPath = useCurrentPath();

    const navItems = routes.map((route) => {
        if (!route.navigationText) return null;
        
        return (
            <NavItem
                key={route.path}
                path={route.path}
                text={route.navigationText}
                active={currentPath === route.path}
            />
        );
    });

    return (
        <header>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <Link key="brand" to="#" className="navbar-brand">{title}</Link>
                <button 
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                    
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        {navItems}
                    </ul>

                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                        <GameDisplay
                            className="nav-item"
                        />
                    </ul>
                </div>

            </nav>
        </header>
    );
}

function NavItem({
    path,
    text,
    active
}={}) {
    let className = combineClassNames("nav-link", active ? "active" : null)

    return (
        <li className="nav-item">
            <Link to={path} className={className}>{text}</Link>
        </li>
    );
}

function Footer() {
    return (
        <footer className="container-fluid m-0 bg-light">
            <p>
                Ptolemy Henson
            </p>
        </footer>
    );
}
