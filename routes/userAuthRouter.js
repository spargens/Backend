const express=require('express')
const router=express.Router()
const multer=require('multer');
const path=require('path');
const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'userImage')
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+path.extname(file.originalname))
    }
});
const upload=multer({storage:storage});
const{loginUser,registerUser}=require('../controllers/userAuthControllers')

router.post('/register',upload.single('image'),registerUser)
router.post('/login',loginUser)

module.exports=router