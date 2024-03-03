import React from 'react';
import { Link, NavLink, Outlet, RouterProvider } from 'react-router-dom';
import { pathToNavText, router } from 'src/lib/Browser';
import { combineClassNames } from 'src/lib/Misc';
import { useCookies } from 'react-cookie';
import { BingoGameDataProvider } from 'src/lib/BingoUtil';
import GameDisplay from 'src/components/GameDisplay';

export function PageLayout() {
    const [cookies] = useCookies(["currentGame"]);
    
    const routerElements = [
        <Header title="Bingo App" key="head" />,
        <main className="flex-grow-1" key="body">
            <Outlet />
        </main>,
        <Footer key="foot" />
    ];

    if (cookies.currentGame) {
        return (
            <BingoGameDataProvider
                value={cookies.currentGame}
                primaryKey="id"
            >
                {routerElements}
            </BingoGameDataProvider>
        );
    } else {
        return (
            <BingoGameDataProvider
                data={null}
            >
                {routerElements}
            </BingoGameDataProvider>
        );
    }
}

export default function App() {
    return (
        <RouterProvider router={router} />
    );
}

function Header({
    title
}={}) {
    const navItems = router.getRoutes().map((route) => {
        if (!pathToNavText(route.path)) return null;
        
        return (
            <NavItem
                key={route.path}
                path={route.path}
                text={pathToNavText(route.path)}
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
    text
}={}) {
    return (
        <li className="nav-item">
            <NavLink to={path} className={({isActive}) => combineClassNames("nav-link", isActive ? "active" : null)}>{text}</NavLink>
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
