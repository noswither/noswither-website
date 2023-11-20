import { Link } from "react-router-dom";

function Navbar(){
	return(
		<div className="navbar bg-base-100 fixed">
			<div className="flex-1">
				<Link className="btn btn-ghost normal-case text-3xl font-akira" to="/">TURBOTHREADS</Link>
			</div>
			<div className="flex-none">
				<ul className="menu menu-horizontal px-1 text-lg gap-2 font-poppins">
					<li><Link to="/store">Store</Link></li>	
					<li><Link to="/about">About Us</Link></li>
                    <li><Link to="/contact">Find Us</Link></li>
                    <button className="btn btn-outline btn-accent"><Link to="/community">Community</Link></button>
				</ul>
			</div>
		</div>
	)
}

export default Navbar;
