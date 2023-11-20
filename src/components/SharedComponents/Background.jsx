import { Link } from "react-router-dom";


function Background(){
    useEffect(() => {
    DOTS({
        el: '#vanta',
        mouseControls: true,
        touchControls: true,
        gyroControls: true,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xffffff,
        backgroundColor: 0x202020,
        size: 3.0,
        spacing: 25.00,
        showLines: false
    })
    }, [])
	return(
    <div className="vanta" id="vanta">
    </div>
	)
}

export default Background;
