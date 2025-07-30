import styles from  "./hero.module.css"

const Hero = () => {
    return(
        <div className={styles.heroSection}>
            <div className={styles.textSection}>
                <h1>Turn Your Business Into a Profitable Online Storefront</h1>
                 <p>Create your own branded page, list your products or services, receive payments, and manage everything — all without writing a single line of code.</p>
                 <button>Create Your Storefront</button>
            </div>
            <div className={styles.imageArea}>
                <i class="fa-solid fa-chart-simple"></i>
            </div>
        </div>
    )
}

export default Hero;