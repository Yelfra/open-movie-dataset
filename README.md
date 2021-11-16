# Open Movie Dataset
 Otvoreno Racunarstvo Fran Jelavić
 
 ## Licensing
 MIT License

 ## Author
 Fran Jelavić

 ## Version
 1.0
 ## Language
 English
 
 ## Overview

 ### Database model
 Query commands used to generate tables of the database are listed in tables_sql.txt.

 ### Data
 Query commands used to input data into the database are listed in data_sql.txt.

 ### Generating the JSON file
 Query commands used to generate the movies.JSON file are listed in JSON_gen.txt.

 ### Generating the CSV file
 Command used for generating the movies.CSV file can be found in CSV_gen.txt.

 ## Atribute Overview

 ### Movie

 | Name | Description | Datatype |
 | --- | --- | --- |
 | title | Name of the movie | String (100 Characters) |
 | year | Year the movie was released | Integer |
 | rating_IMDb | Average movie rating on IMDb | Float |
 | duration | Movie duration in minutes | Integer |
 | country | Country of movie origin or production | String (100 Characters) |
 | oscarNom | Number of (Oscar) Academy Awards nominations | Integer |
 | oscars | Number of (Oscars) Academy Awards won | Integer |

 ### Actor

 | Name | Description | Datatype |
 | --- | --- | --- |
 | name | Name of the actor | String (30 Characters) |
 | surname | Surname of the actor | String (30 Characters) |

 ### Director

 | Name | Description | Datatype |
 | --- | --- | --- |
 | name | Name of the director | String (30 Characters) |
 | surname | Surname of the director | String (30 Characters) |

 ### Genre

 | Name | Description | Datatype |
 | --- | --- | --- |
 | name | Name of the genre | String (20 Characters) |


 