import styles from "./menu.module.css"
const Menu = () => {
    return(
        <div className={styles.menuArea}>
<div className={styles.starArea}>
    <i class="fa-solid fa-star"></i>
    <i class="fa-solid fa-star"></i>
    <i class="fa-solid fa-star"></i>
    <i class="fa-solid fa-star"></i>
    <i class="fa-solid fa-star"></i>
</div>
<div className={styles.menu}>
    <i class="fa-solid fa-ellipsis"></i>
</div>
        </div>
    )
}

export default Menu;
