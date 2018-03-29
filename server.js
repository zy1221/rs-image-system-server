const http = require('http'); 
const mysql = require('mysql');
var express = require('express');
var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');
var $=require('jquery');
var BodyParser= require('body-parser');
var multiparty = require('multiparty');
var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    next();
});
app.use(BodyParser.json({ extended: true })); 
var connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'zy920908',
    database:'rsimage',
    multipleStatements: true 
})
connection.connect();
app.get('/getMenuList',function(req,res){
    connection.query('select * from tb_category',function(error1,results1,field1){
        if(error1)throw error1;
        connection.query('select * from tb_image',function(error2,results2,field2){
            if(error2)throw error2;
            var listdata = getMenuList(results1,results2);
            res.send(JSON.stringify(listdata));          
        })  
    });    
})

app.get('/getImageInfo',function(req,res){
    connection.query('select * from tb_image',function(error,results,field){
        if(error)throw error;
        res.send(JSON.stringify(results));
    });    
})

app.get('/getCategoryInfo',function(req,res){
    connection.query('select * from tb_category',function(error,results,field){
        if(error)throw error;
        res.send(JSON.stringify(results));
    });    
})
app.post('/deleteInfo',function(req,res){
    var keys = req.body;
    var sql = '';
    var categoryPath = [];
    var path = [];
    var placePath="./public/upload/"+place+'/';
    var path="./public/upload/"+place+'/'+category+'/';
    keys.map(item => {
        var itemArray = item.split('&');
        if(itemArray.length>1){
            if(itemArray.length === 2){
                sql+='delete from tb_image where category_id = \''+itemArray[0]
                +'\' AND location_name = \''+itemArray[1]+'\';';
            }
            else if(itemArray.length === 3){
                sql+='delete from tb_image where category_id = \''+itemArray[0]
                +'\' AND location_name = \''+itemArray[1]
                +'\'AND image_name = \''+itemArray[2]+'\';';
            }
        }
    })
    connection.query(sql,function(error,results,field){
        if(error)throw error;
        res.send(JSON.stringify('OK'));
    });    
})
app.post('/addCategoryName',function(req,res){
    var sql1 = 'select max(ID) as maxid from tb_category; select max(category_id) as maxcategoryid from tb_category'
    
    connection.query(sql1,function(error1,results1,field1){
        if(error1)throw error1;
        
        var maxid1 =results1[0][0];
        var maxcategoryid1 =results1[1][0];
        
        var maxid = maxid1.maxid;
        var maxcategoryid = maxcategoryid1.maxcategoryid;
        
        var id = maxid+1;
        var categoryid = maxcategoryid+1;
        
        var sql2 = 'insert into tb_category (ID,category_name,category_id) values ('+id+',\''+req.body.categoryName+'\','+categoryid+')'
        connection.query(sql2,function(error,results,field){
            if(error)throw error;
            res.send(JSON.stringify('OK'));
        });    
    });   
})

app.post('/submitForm',function(req,res){
    var form = new multiparty.Form({
        uploadDir: './server/public/upload/',
        encoding: 'utf-8'
    });
    form.parse(req,function(err, fields, files) {
        var imgs = files.image_name;

        var location_name = fields.location_name[0];
        var satellite_name = fields.satellite_name[0];
        var category_id = Number(fields.category_id[0]);
        var image_time = fields.image_time[0];
        var image_description =fields.image_description[0];
        var image_resolution =fields.image_resolution[0];

        var lt_lon = Number(fields.lt_lon[0]);
        var lt_lat = Number(fields.lt_lat[0]);
        var rt_lon = Number(fields.rt_lon[0]);
        var rt_lat = Number(fields.rt_lat[0]);
       
        var lb_lon = Number(fields.lb_lon[0]);
        var lb_lat = Number(fields.lb_lat[0]);
        var rb_lon = Number(fields.rb_lon[0]);
        var rb_lat = Number(fields.rb_lat[0]);

        
        //地名和类型路径
        var categoryPath = `./server/public//upload/${category_id}`
        var placePath=`./server//public/upload/${category_id}/${location_name}`;
        

        //遍历图片
        //存放重复图片名字
        var photos=[]
        var sqlMax = `select max(ID) as id from tb_image;
         select max(image_id) as imageId from tb_image;`
        connection.query(sqlMax,function(error,results,field){
            if(error)throw error;
            imgs.forEach(function(item,i){
                var insertId =results[0][0].id ? results[0][0].id + i+1: 1;
                var insertImageId = results[1][0].imageId? results[1][0].imageId + i+1:1;
                // var satellite_id = results[2][0].satelliteId;

                var sqlInsert = `insert into tb_image values
                ('${insertId}','${item.originalFilename}','${insertImageId}','${image_time}',
                '${image_resolution}','${image_description}','${location_name}','${category_id}','${satellite_name}',
                '${lt_lon}','${lt_lat}','${rt_lon}','${rt_lat}',
                '${lb_lon}','${lb_lat}','${rb_lon}','${rb_lat}')`

                var imagePath = `${placePath}/${item.originalFilename}`
                if(fs.existsSync(imagePath)){
                    photos.push(item.originalFilename);
                    fs.unlinkSync(item.path)
                }else{
                    if(!fs.existsSync(placePath)){
                        if(fs.existsSync(categoryPath)){
                            fs.mkdirSync(placePath)
                        }else{
                            fs.mkdirSync(categoryPath);
                            fs.mkdirSync(placePath);
                        }         
                        connection.query(sqlInsert,function(error,results1,field){
                            if(error)throw error;
                            fs.rename(item.path, imagePath); 
                        }); 
                    }
                    else{
                        connection.query(sqlInsert,function(error,results,field){
                            if(error)throw error;
                            fs.rename(item.path, imagePath);
                        });   
                    }
                }
                
            });
            res.send(JSON.stringify({'photos':photos}));
        });   
        
    })
    
})
var server=app.listen(3001,function(){
    var host=server.address().address;
    var port= server.address().port;
    console.log('Example app listening at localhost:%s',port);
})


function getMenuList(categoryData,imageData){
    var listdata=[];
    
    for(var i=0;i<categoryData.length;i++){
        var listitem =
        {
            title:categoryData[i].category_name,
            key:categoryData[i].category_id,
            children:[]
        };
        listdata.push(listitem);
    }
    for(var j=0;j<listdata.length;j++){
        var imageItems=[];
        for (var i=0;i<imageData.length;i++){
            if(imageData[i].category_id === listdata[j].key){  
                var imageItem = {
                    title:imageData[i].image_name,
                    key:imageData[i].image_name,
                    place:imageData[i].location_name
                }
                imageItems.push(imageItem);
            }
        }
        var placeItems=[];
        for (var k=0;k<imageItems.length;k++){
            if(placeItems.indexOf(imageItems[k].place)==-1){
                placeItems.push(imageItems[k].place)
            }                   
        }
        for(var k=0;k<placeItems.length;k++){
            var placeItem={
                title:placeItems[k],
                key:listdata[j].key+'&'+placeItems[k],
                children:[]
            }
            for(var h=0;h<imageItems.length;h++){
                if(imageItems[h].place===placeItems[k]){
                    imageItems[h].key=placeItem.key+'&'+imageItems[h].key;
                    placeItem.children.push(imageItems[h]);
                }
            }
            listdata[j].children.push(placeItem);
        }

    }
    return listdata;
}
function deleteFolderRecursive(url,filename) {
    var files = [];
    //判断给定的路径是否存在
    if( fs.existsSync(url) ) {
      files = fs.readdirSync(url);
      files.forEach(function(file,index){
        var curPath = path.join(url,file);
          if(file===filename){
              fs.unlinkSync(curPath)
          }
      });
    }
  };